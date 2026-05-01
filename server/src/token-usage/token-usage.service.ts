import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, FindOptionsWhere } from 'typeorm';
import { TokenUsage } from '../entities';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TokenUsageService {
  constructor(
    @InjectRepository(TokenUsage)
    private tokenUsageRepository: Repository<TokenUsage>,
    private dataSource: DataSource,
  ) {}

  async recordUsage(data: {
    userId: string;
    appId?: string | null;
    apiKeyId?: string | null;
    promptTokens: number;
    completionTokens: number;
    model?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<TokenUsage> {
    const usage = this.tokenUsageRepository.create({
      userId: data.userId,
      appId: data.appId || null,
      apiKeyId: data.apiKeyId || null,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.promptTokens + data.completionTokens,
      model: data.model || null,
      metadata: data.metadata || null,
    });

    return this.tokenUsageRepository.save(usage);
  }

  async findByUser(
    userId: string,
    paginationDto: PaginationDto,
    filters?: {
      apiKeyId?: string;
      appId?: string;
      model?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{
    usages: TokenUsage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<TokenUsage> = { userId };

    if (filters?.apiKeyId) {
      where.apiKeyId = filters.apiKeyId;
    }

    if (filters?.appId) {
      where.appId = filters.appId;
    }

    if (filters?.model) {
      where.model = filters.model;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const [usages, total] = await this.tokenUsageRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      usages,
      total,
      page,
      limit,
    };
  }

  async getUserStats(
    userId: string,
    filters?: {
      apiKeyId?: string;
      appId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestCount: number;
  }> {
    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select('SUM(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('SUM(tokenUsage.promptTokens)', 'promptTokens')
      .addSelect('SUM(tokenUsage.completionTokens)', 'completionTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('tokenUsage.userId = :userId', { userId });

    if (filters?.apiKeyId) {
      queryBuilder.andWhere('tokenUsage.apiKeyId = :apiKeyId', {
        apiKeyId: filters.apiKeyId,
      });
    }

    if (filters?.appId) {
      queryBuilder.andWhere('tokenUsage.appId = :appId', {
        appId: filters.appId,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere(
        'tokenUsage.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    const result = await queryBuilder.getRawOne();

    return {
      totalTokens: Number(result.totalTokens) || 0,
      promptTokens: Number(result.promptTokens) || 0,
      completionTokens: Number(result.completionTokens) || 0,
      requestCount: Number(result.requestCount) || 0,
    };
  }

  async getAppStats(
    appId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestCount: number;
  }> {
    const where: any = { appId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const result = await this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select('SUM(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('SUM(tokenUsage.promptTokens)', 'promptTokens')
      .addSelect('SUM(tokenUsage.completionTokens)', 'completionTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where(where)
      .getRawOne();

    return {
      totalTokens: Number(result.totalTokens) || 0,
      promptTokens: Number(result.promptTokens) || 0,
      completionTokens: Number(result.completionTokens) || 0,
      requestCount: Number(result.requestCount) || 0,
    };
  }

  async getDailyStats(
    userId: string,
    days: number = 30,
    filters?: {
      apiKeyId?: string;
      appId?: string;
    },
  ): Promise<
    Array<{ date: string; totalTokens: number; requestCount: number }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select('DATE(tokenUsage.createdAt)', 'date')
      .addSelect('SUM(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('tokenUsage.userId = :userId', { userId })
      .andWhere('tokenUsage.createdAt >= :startDate', { startDate });

    if (filters?.apiKeyId) {
      queryBuilder.andWhere('tokenUsage.apiKeyId = :apiKeyId', {
        apiKeyId: filters.apiKeyId,
      });
    }

    if (filters?.appId) {
      queryBuilder.andWhere('tokenUsage.appId = :appId', {
        appId: filters.appId,
      });
    }

    const result = await queryBuilder
      .groupBy('DATE(tokenUsage.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      date: item.date,
      totalTokens: Number(item.totalTokens) || 0,
      requestCount: Number(item.requestCount) || 0,
    }));
  }

  async getWeeklyStats(
    userId: string,
    weeks: number = 12,
    filters?: {
      apiKeyId?: string;
      appId?: string;
    },
  ): Promise<
    Array<{ week: string; totalTokens: number; requestCount: number }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select("TO_CHAR(tokenUsage.createdAt, 'IYYY-IW')", 'week')
      .addSelect('SUM(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('tokenUsage.userId = :userId', { userId })
      .andWhere('tokenUsage.createdAt >= :startDate', { startDate });

    if (filters?.apiKeyId) {
      queryBuilder.andWhere('tokenUsage.apiKeyId = :apiKeyId', {
        apiKeyId: filters.apiKeyId,
      });
    }

    if (filters?.appId) {
      queryBuilder.andWhere('tokenUsage.appId = :appId', {
        appId: filters.appId,
      });
    }

    const result = await queryBuilder
      .groupBy("TO_CHAR(tokenUsage.createdAt, 'IYYY-IW')")
      .orderBy('week', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      week: item.week,
      totalTokens: Number(item.totalTokens) || 0,
      requestCount: Number(item.requestCount) || 0,
    }));
  }

  async getMonthlyStats(
    userId: string,
    months: number = 12,
    filters?: {
      apiKeyId?: string;
      appId?: string;
    },
  ): Promise<
    Array<{ month: string; totalTokens: number; requestCount: number }>
  > {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select("TO_CHAR(tokenUsage.createdAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('tokenUsage.userId = :userId', { userId })
      .andWhere('tokenUsage.createdAt >= :startDate', { startDate });

    if (filters?.apiKeyId) {
      queryBuilder.andWhere('tokenUsage.apiKeyId = :apiKeyId', {
        apiKeyId: filters.apiKeyId,
      });
    }

    if (filters?.appId) {
      queryBuilder.andWhere('tokenUsage.appId = :appId', {
        appId: filters.appId,
      });
    }

    const result = await queryBuilder
      .groupBy("TO_CHAR(tokenUsage.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      month: item.month,
      totalTokens: Number(item.totalTokens) || 0,
      requestCount: Number(item.requestCount) || 0,
    }));
  }

  async getModelsStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{ model: string | null; totalTokens: number; requestCount: number }>
  > {
    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select('tokenUsage.model', 'model')
      .addSelect('SUM(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('tokenUsage.userId = :userId', { userId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'tokenUsage.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const result = await queryBuilder
      .groupBy('tokenUsage.model')
      .orderBy('totalTokens', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      model: item.model,
      totalTokens: Number(item.totalTokens) || 0,
      requestCount: Number(item.requestCount) || 0,
    }));
  }

  async getApiKeyStats(
    userId: string,
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestCount: number;
  }> {
    return this.getUserStats(userId, {
      apiKeyId,
      startDate,
      endDate,
    });
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
