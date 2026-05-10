import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL')!;
    const url = new URL(redisUrl);
    this.client = new Redis({
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      db: url.pathname ? parseInt(url.pathname.slice(1)) : 0,
      password: url.password || undefined,
    });
    this.client.on('error', (_error) => {});
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.client.setex(key, ttl, value);
    }
    return this.client.set(key, value);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }
}
