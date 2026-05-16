import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { App } from '../entities/app.entity';

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(
    private redisService: RedisService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
  ) {}

  private getDailyKey(prefix: string, id: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `${prefix}:${id}:daily:${today}`;
  }

  private getMonthlyKey(prefix: string, id: string): string {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `${prefix}:${id}:monthly:${monthKey}`;
  }

  async checkQuota(
    userId: string,
    appId?: string,
  ): Promise<{
    allowed: boolean;
    dailyRemaining: number;
    monthlyRemaining: number;
    message?: string;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return {
        allowed: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        message: '用户不存在',
      };
    }

    const dailyKey = this.getDailyKey('user', userId);
    const monthlyKey = this.getMonthlyKey('user', userId);

    const [dailyUsed, monthlyUsed] = await Promise.all([
      this.getUsage(dailyKey),
      this.getUsage(monthlyKey),
    ]);

    const dailyRemaining = Math.max(0, user.dailyQuota - dailyUsed);
    const monthlyRemaining = Math.max(0, user.monthlyQuota - monthlyUsed);

    if (dailyUsed >= user.dailyQuota) {
      return {
        allowed: false,
        dailyRemaining: 0,
        monthlyRemaining,
        message: '每日配额已用尽',
      };
    }

    if (monthlyUsed >= user.monthlyQuota) {
      return {
        allowed: false,
        dailyRemaining,
        monthlyRemaining: 0,
        message: '每月配额已用尽',
      };
    }

    if (appId) {
      const app = await this.appRepository.findOne({ where: { id: appId } });
      if (app && app.dailyQuota !== null) {
        const appDailyKey = this.getDailyKey('app', appId);
        const appDailyUsed = await this.getUsage(appDailyKey);
        if (appDailyUsed >= app.dailyQuota) {
          return {
            allowed: false,
            dailyRemaining,
            monthlyRemaining,
            message: '应用每日配额已用尽',
          };
        }
      }
    }

    return { allowed: true, dailyRemaining, monthlyRemaining };
  }

  async consumeQuota(userId: string, appId?: string): Promise<void> {
    const dailyKey = this.getDailyKey('user', userId);
    const monthlyKey = this.getMonthlyKey('user', userId);

    await Promise.all([
      this.incrementUsage(dailyKey),
      this.incrementUsage(monthlyKey),
    ]);

    if (appId) {
      const appDailyKey = this.getDailyKey('app', appId);
      await this.incrementUsage(appDailyKey);
    }

    this.logger.log(`Quota consumed for user: ${userId}, app: ${appId}`);
  }

  private async getUsage(key: string): Promise<number> {
    const value = await this.redisService.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  private async incrementUsage(key: string): Promise<void> {
    await this.redisService.getClient().incr(key);
    await this.redisService.getClient().expire(key, 60 * 60 * 24 * 31);
  }

  async getQuotaInfo(userId: string): Promise<{
    dailyQuota: number;
    monthlyQuota: number;
    dailyUsed: number;
    monthlyUsed: number;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const dailyKey = this.getDailyKey('user', userId);
    const monthlyKey = this.getMonthlyKey('user', userId);

    const [dailyUsed, monthlyUsed] = await Promise.all([
      this.getUsage(dailyKey),
      this.getUsage(monthlyKey),
    ]);

    return {
      dailyQuota: user.dailyQuota,
      monthlyQuota: user.monthlyQuota,
      dailyUsed,
      monthlyUsed,
    };
  }

  async updateUserQuota(
    userId: string,
    dailyQuota: number,
    monthlyQuota: number,
  ): Promise<void> {
    await this.userRepository.update(userId, { dailyQuota, monthlyQuota });
    this.logger.log(
      `Updated quota for user ${userId}: daily=${dailyQuota}, monthly=${monthlyQuota}`,
    );
  }

  async updateAppQuota(
    appId: string,
    dailyQuota: number | null,
    monthlyQuota: number | null,
  ): Promise<void> {
    await this.appRepository.update(appId, { dailyQuota, monthlyQuota });
    this.logger.log(
      `Updated quota for app ${appId}: daily=${dailyQuota}, monthly=${monthlyQuota}`,
    );
  }
}
