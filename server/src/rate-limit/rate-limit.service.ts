import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/** 内存版的限流：在 key 对应的数组中保留窗口内所有请求的时间戳 */
interface MemoryWindow {
  timestamps: number[];
  /** 用来表达 redis 的 ttl：窗口最后一次写入时间 + windowSeconds */
  expiresAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly memoryStore = new Map<string, MemoryWindow>();

  constructor(private redisService: RedisService) {}

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const client = this.redisService.getClient();

    if (client) {
      try {
        await client.zremrangebyscore(key, 0, windowStart);
        const requestCount = await client.zcard(key);

        if (requestCount >= limit) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: now + windowSeconds * 1000,
          };
        }

        await client.zadd(key, now.toString(), now.toString());
        await client.expire(key, windowSeconds);

        return {
          allowed: true,
          remaining: limit - requestCount - 1,
          resetAt: now + windowSeconds * 1000,
        };
      } catch (err) {
        this.logger.warn(
          `rate-limit redis command failed for ${identifier}, falling back to in-memory: ${
            (err as Error).message
          }`,
        );
        return this.checkRateLimitInMemory(
          key,
          now,
          windowStart,
          limit,
          windowSeconds,
        );
      }
    }

    return this.checkRateLimitInMemory(
      key,
      now,
      windowStart,
      limit,
      windowSeconds,
    );
  }

  private checkRateLimitInMemory(
    key: string,
    now: number,
    windowStart: number,
    limit: number,
    windowSeconds: number,
  ): { allowed: boolean; remaining: number; resetAt: number } {
    let entry = this.memoryStore.get(key);

    // 清理过期的窗口
    if (!entry || entry.expiresAt < now) {
      entry = { timestamps: [], expiresAt: now + windowSeconds * 1000 };
    }
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= limit) {
      this.memoryStore.set(key, entry);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + windowSeconds * 1000,
      };
    }

    entry.timestamps.push(now);
    entry.expiresAt = now + windowSeconds * 1000;
    this.memoryStore.set(key, entry);

    return {
      allowed: true,
      remaining: limit - entry.timestamps.length,
      resetAt: now + windowSeconds * 1000,
    };
  }

  async enforceRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const result = await this.checkRateLimit(identifier, limit, windowSeconds);

    if (!result.allowed) {
      throw new HttpException(
        {
          message: '请求频率超限，请稍后再试',
          resetAt: new Date(result.resetAt).toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
