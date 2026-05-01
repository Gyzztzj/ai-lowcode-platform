import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
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

    await client.zremrangebyscore(key, 0, windowStart);

    const requestCount = await client.zcard(key);

    const resetAt = now + windowSeconds * 1000;

    if (requestCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    await client.zadd(key, now.toString(), now.toString());
    await client.expire(key, windowSeconds);

    return {
      allowed: true,
      remaining: limit - requestCount - 1,
      resetAt,
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

  async setCircuitBreaker(
    serviceName: string,
    threshold: number,
    windowSeconds: number,
  ): Promise<void> {
    const key = `circuit_breaker:${serviceName}`;
    const client = this.redisService.getClient();
    await client.hset(
      key,
      'threshold',
      threshold.toString(),
      'windowSeconds',
      windowSeconds.toString(),
      'failures',
      '0',
      'open',
      'false',
    );
  }

  async recordFailure(serviceName: string): Promise<boolean> {
    const key = `circuit_breaker:${serviceName}`;
    const client = this.redisService.getClient();

    const data = await client.hgetall(key);

    if (!data || data.open === 'true') {
      return false;
    }

    const failures = parseInt(data.failures || '0', 10) + 1;
    const threshold = parseInt(data.threshold || '5', 10);

    await client.hset(key, 'failures', failures.toString());

    if (failures >= threshold) {
      await client.hset(key, 'open', 'true');
      const windowSeconds = parseInt(data.windowSeconds || '60', 10);
      await client.expire(key, windowSeconds);
      return true;
    }

    return false;
  }

  async isCircuitBreakerOpen(serviceName: string): Promise<boolean> {
    const key = `circuit_breaker:${serviceName}`;
    const data = await this.redisService.getClient().hgetall(key);
    return data?.open === 'true';
  }

  async resetCircuitBreaker(serviceName: string): Promise<void> {
    const key = `circuit_breaker:${serviceName}`;
    const client = this.redisService.getClient();
    await client.hset(key, 'failures', '0', 'open', 'false');
  }
}
