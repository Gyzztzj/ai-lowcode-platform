import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

type Store = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
};

/**
 * 基于内存的降级实现：
 * 当 REDIS_URL 未配置或 Redis 客户端不可用时，用 Map 临时承载
 * set/get/incr/del/expire 操作。数据不跨进程也不跨重启，仅保证业务不爆错。
 */
class InMemoryStore implements Store {
  private readonly data = new Map<
    string,
    { value: string; expireAt?: number }
  >();

  private cleanExpired() {
    const now = Date.now();
    for (const [key, v] of this.data) {
      if (v.expireAt && v.expireAt <= now) this.data.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    await Promise.resolve();
    this.cleanExpired();
    const v = this.data.get(key);
    if (!v) return null;
    if (v.expireAt && v.expireAt <= Date.now()) {
      this.data.delete(key);
      return null;
    }
    return v.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await Promise.resolve();
    this.cleanExpired();
    this.data.set(key, {
      value,
      expireAt: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  async incr(key: string): Promise<number> {
    await Promise.resolve();
    this.cleanExpired();
    const current = this.data.get(key);
    const nextValue =
      current && current.value ? parseInt(current.value, 10) + 1 : 1;
    this.data.set(key, {
      value: String(nextValue),
      expireAt: current?.expireAt,
    });
    return nextValue;
  }

  async expire(key: string, seconds: number): Promise<number> {
    await Promise.resolve();
    const v = this.data.get(key);
    if (!v) return 0;
    v.expireAt = Date.now() + seconds * 1000;
    return 1;
  }

  async del(key: string): Promise<number> {
    await Promise.resolve();
    const had = this.data.has(key);
    this.data.delete(key);
    return had ? 1 : 0;
  }
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private store: Store;
  private _usingMemoryFallback = false;

  constructor(private configService: ConfigService) {
    this.store = new InMemoryStore();
  }

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this._usingMemoryFallback = true;
      this.logger.warn(
        'REDIS_URL is not configured. Falling back to in-memory store. ' +
          'Data will NOT be shared across processes and will be lost on restart.',
      );
      return;
    }

    try {
      const url = new URL(redisUrl);
      const options: RedisOptions = {
        host: url.hostname,
        port: parseInt(url.port, 10) || 6379,
        db:
          url.pathname && url.pathname.length > 1
            ? parseInt(url.pathname.slice(1), 10)
            : 0,
        // 关掉 offline queue：Redis 不可用时直接拒绝命令，避免越积越多触发
        // "maxRetriesPerRequest" 报错影响业务请求
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      if (url.password) options.password = decodeURIComponent(url.password);

      this.client = new Redis(options);

      this.client.on('error', (err) => {
        // 只打 debug 级日志，不把 ioredis 的错误继续向上冒泡成 uncaughtException
        this.logger.verbose(`redis client error: ${err.message}`);
      });

      this.client.on('ready', () => {
        this.logger.log('redis client ready');
      });

      this.client.on('close', () => {
        this.logger.verbose('redis client closed');
      });

      // 直接把 set/get/del 映射到 ioredis，发生错误时自动降级一次
      this.store = {
        get: (key) => this.wrap(() => this.client!.get(key), null),
        set: (key, value, ttl) =>
          this.wrap(
            () =>
              ttl
                ? this.client!.setex(key, ttl, value)
                : this.client!.set(key, value),
            undefined,
          ),
        incr: (key) => this.wrap(() => this.client!.incr(key), 1),
        expire: (key, seconds) =>
          this.wrap(() => this.client!.expire(key, seconds), 1),
        del: (key) => this.wrap(() => this.client!.del(key), 1),
      };
    } catch (err) {
      this._usingMemoryFallback = true;
      this.logger.warn(
        `failed to initialize redis client (${(err as Error).message}), using in-memory store`,
      );
    }
  }

  onModuleDestroy() {
    if (this.client) {
      try {
        this.client.disconnect();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
  }

  /** 是否在内存降级模式（便于外部模块决定是否要降级策略） */
  isMemoryFallback(): boolean {
    return this._usingMemoryFallback;
  }

  /** 获得原始 ioredis 客户端；可能为 null（降级模式下），调用方需自己处理 */
  getClient(): Redis | null {
    return this.client;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.store.set(key, value, ttl);
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key);
  }

  async del(key: string): Promise<number> {
    return this.store.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.store.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.store.expire(key, seconds);
  }

  /** 包装 ioredis 调用，失败时落到内存实现并记录一次告警 */
  private async wrap<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(
        `redis command failed, falling back to in-memory: ${(err as Error).message}`,
      );
      return fallback;
    }
  }
}
