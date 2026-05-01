import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { TokenUsageService } from '../token-usage/token-usage.service';

export interface QuotaConfig {
  userId: string;
  maxTokensPerDay: number;
  maxRequestsPerMinute: number;
  maxConcurrentRequests: number;
}

export interface UsageState {
  tokensUsedToday: number;
  requestsThisMinute: number;
  concurrentRequests: number;
}

export interface SystemUsage {
  totalUsers: number;
  totalTokensToday: number;
  totalRequestsToday: number;
  activeUsers: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remainingTokens?: number;
}

@Injectable()
export class ResourceManagementService {
  private readonly logger = new Logger(ResourceManagementService.name);
  private readonly defaultQuota: Omit<QuotaConfig, 'userId'> = {
    maxTokensPerDay: 1000000,
    maxRequestsPerMinute: 100,
    maxConcurrentRequests: 10,
  };

  constructor(
    private readonly redisService: RedisService,
    private readonly tokenUsageService: TokenUsageService,
  ) {}

  async checkAndConsumeQuota(
    userId: string,
    estimatedTokens: number,
    apiKeyId?: string,
  ): Promise<{ allowed: boolean; reason?: string; remainingTokens?: number }> {
    const client = this.redisService.getClient();
    const now = new Date();
    const todayKey = `quota:${userId}:tokens:${now.toISOString().split('T')[0]}`;
    const minuteKey = `quota:${userId}:requests:${Math.floor(now.getTime() / 60000)}`;
    const concurrentKey = `quota:${userId}:concurrent`;

    const quota = await this.getUserQuota(userId);

    const currentTokens = await client.get(todayKey);
    const tokensUsedToday = currentTokens ? parseInt(currentTokens, 10) : 0;

    if (tokensUsedToday + estimatedTokens > quota.maxTokensPerDay) {
      return {
        allowed: false,
        reason: `Daily token quota exceeded. Used: ${tokensUsedToday}, Max: ${quota.maxTokensPerDay}`,
        remainingTokens: Math.max(0, quota.maxTokensPerDay - tokensUsedToday),
      };
    }

    const currentRequests = await client.get(minuteKey);
    const requestsThisMinute = currentRequests
      ? parseInt(currentRequests, 10)
      : 0;

    if (requestsThisMinute >= quota.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Request rate limit exceeded. Requests this minute: ${requestsThisMinute}, Max: ${quota.maxRequestsPerMinute}`,
      };
    }

    const currentConcurrent = await client.get(concurrentKey);
    const concurrentRequests = currentConcurrent
      ? parseInt(currentConcurrent, 10)
      : 0;

    if (concurrentRequests >= quota.maxConcurrentRequests) {
      return {
        allowed: false,
        reason: `Concurrent request limit exceeded. Active: ${concurrentRequests}, Max: ${quota.maxConcurrentRequests}`,
      };
    }

    await client.incrby(todayKey, estimatedTokens);
    await client.expire(todayKey, 86400);

    await client.incr(minuteKey);
    await client.expire(minuteKey, 60);

    await client.incr(concurrentKey);

    return {
      allowed: true,
      remainingTokens:
        quota.maxTokensPerDay - tokensUsedToday - estimatedTokens,
    };
  }

  async releaseConcurrentRequest(userId: string): Promise<void> {
    const client = this.redisService.getClient();
    const concurrentKey = `quota:${userId}:concurrent`;

    const current = await client.get(concurrentKey);
    if (current && parseInt(current, 10) > 0) {
      await client.decr(concurrentKey);
    }
  }

  async getUserQuota(userId: string): Promise<QuotaConfig> {
    const client = this.redisService.getClient();
    const quotaKey = `quota:${userId}:config`;

    const cachedQuota = await client.get(quotaKey);
    if (cachedQuota) {
      return { userId, ...JSON.parse(cachedQuota) };
    }

    return { userId, ...this.defaultQuota };
  }

  async setUserQuota(
    userId: string,
    quota: Partial<Omit<QuotaConfig, 'userId'>>,
  ): Promise<QuotaConfig> {
    const client = this.redisService.getClient();
    const quotaKey = `quota:${userId}:config`;

    const currentQuota = await this.getUserQuota(userId);
    const newQuota = { ...currentQuota, ...quota };

    await client.set(
      quotaKey,
      JSON.stringify({
        maxTokensPerDay: newQuota.maxTokensPerDay,
        maxRequestsPerMinute: newQuota.maxRequestsPerMinute,
        maxConcurrentRequests: newQuota.maxConcurrentRequests,
      }),
    );

    return newQuota;
  }

  async getUsageState(userId: string): Promise<UsageState & QuotaConfig> {
    const client = this.redisService.getClient();
    const now = new Date();
    const todayKey = `quota:${userId}:tokens:${now.toISOString().split('T')[0]}`;
    const minuteKey = `quota:${userId}:requests:${Math.floor(now.getTime() / 60000)}`;
    const concurrentKey = `quota:${userId}:concurrent`;

    const quota = await this.getUserQuota(userId);
    const tokensUsedToday = parseInt((await client.get(todayKey)) || '0', 10);
    const requestsThisMinute = parseInt(
      (await client.get(minuteKey)) || '0',
      10,
    );
    const concurrentRequests = parseInt(
      (await client.get(concurrentKey)) || '0',
      10,
    );

    return {
      ...quota,
      tokensUsedToday,
      requestsThisMinute,
      concurrentRequests,
    };
  }

  async resetUserQuota(userId: string): Promise<void> {
    const client = this.redisService.getClient();
    const keys = [`quota:${userId}:config`, `quota:${userId}:concurrent`];

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinute = Math.floor(now.getTime() / 60000);

    for (let i = 0; i < 1440; i++) {
      keys.push(`quota:${userId}:requests:${currentMinute - i}`);
    }

    keys.push(`quota:${userId}:tokens:${today}`);

    await client.del(keys);
  }

  async getSystemUsage(): Promise<{
    totalUsers: number;
    totalTokensToday: number;
    totalRequestsToday: number;
    activeUsers: number;
  }> {
    const client = this.redisService.getClient();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const keys = await client.keys(`quota:*:tokens:${today}`);

    let totalTokensToday = 0;
    const userSet = new Set<string>();

    for (const key of keys) {
      const tokens = await client.get(key);
      if (tokens) {
        totalTokensToday += parseInt(tokens, 10);
        const userIdMatch = key.match(/quota:([^:]+):tokens/);
        if (userIdMatch) {
          userSet.add(userIdMatch[1]);
        }
      }
    }

    return {
      totalUsers: userSet.size,
      totalTokensToday,
      totalRequestsToday: 0,
      activeUsers: userSet.size,
    };
  }

  async recordActualUsage(
    userId: string,
    promptTokens: number,
    completionTokens: number,
    appId?: string,
    apiKeyId?: string,
    model?: string,
  ): Promise<void> {
    try {
      await this.tokenUsageService.recordUsage({
        userId,
        appId,
        apiKeyId,
        promptTokens,
        completionTokens,
        model,
      });
    } catch (error) {
      this.logger.error('Failed to record token usage', error);
    }
  }
}
