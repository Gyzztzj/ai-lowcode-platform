/**
 * 令牌使用服务
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, FindOptionsWhere } from 'typeorm';
import { TokenUsage, Model } from '../entities';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TokenUsageService {
  constructor(
    @InjectRepository(TokenUsage)
    private tokenUsageRepository: Repository<TokenUsage>,
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
    private dataSource: DataSource,
  ) {}

  /**
   * 记录令牌使用
   * @param data 令牌使用数据对象
   * @returns 记录的令牌使用对象
   */
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

  /**
   * 查找用户令牌使用记录
   * @param userId 用户ID
   * @param paginationDto 分页参数
   * @param filters 过滤参数（可选）
   * @returns 令牌使用记录列表
   */
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

  /**
   * 获取用户令牌使用统计
   * @param userId 用户ID
   * @param filters 过滤参数（可选）
   * @returns 令牌使用统计对象
   */
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

  /**
   * 获取应用令牌使用统计
   * @param appId 应用ID
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 令牌使用统计对象
   */
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

  /**
   * 获取用户令牌令牌使用统计
   * @param userId 用户ID
   * @param days 时间范围（天数）
   * @param filters 过滤参数（可选）
   * @returns 令牌使用统计对象
   */
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

  /**
   * 获取用户令牌令牌使用统计
   * @param userId 用户ID
   * @param weeks 时间范围（周数）
   * @param filters 过滤参数（可选）
   * @returns 令牌使用统计对象
   */
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

  /**
   * 获取用户令牌令牌使用统计
   * @param userId 用户ID
   * @param months 时间范围（月数）
   * @param filters 过滤参数（可选）
   * @returns 令牌使用统计对象
   */
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

  /**
   * 获取用户令牌令牌使用统计
   * @param userId 用户ID
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 令牌使用统计对象
   */
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

  /**
   * 获取用户令牌令牌使用统计
   * @param userId 用户ID
   * @param apiKeyId API密钥ID
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 令牌使用统计对象
   */
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

  /**
   * 估算文本令牌数
   * @param text 文本内容
   * @returns 估算的令牌数
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async getModelPricing(
    modelName: string | null,
  ): Promise<{ promptPrice: number; completionPrice: number }> {
    if (!modelName) {
      return { promptPrice: 0.0015, completionPrice: 0.002 };
    }

    const model = await this.modelRepository.findOne({
      where: { modelId: modelName },
    });

    if (model && model.promptTokenPrice > 0 && model.completionTokenPrice > 0) {
      return {
        promptPrice: model.promptTokenPrice,
        completionPrice: model.completionTokenPrice,
      };
    }

    const defaultPricing: Record<
      string,
      { prompt: number; completion: number }
    > = {
      'gpt-4o': { prompt: 0.005, completion: 0.015 },
      'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      'doubao-3-5-pro': { prompt: 0.0008, completion: 0.0012 },
      'doubao-4': { prompt: 0.002, completion: 0.004 },
    };

    const match = Object.keys(defaultPricing).find((key) =>
      modelName.toLowerCase().includes(key.toLowerCase()),
    );

    if (match) {
      return {
        promptPrice: defaultPricing[match].prompt,
        completionPrice: defaultPricing[match].completion,
      };
    }

    return { promptPrice: 0.0015, completionPrice: 0.002 };
  }

  async getUserCostStats(
    userId: string,
    filters?: {
      apiKeyId?: string;
      appId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{
    totalCost: number;
    promptCost: number;
    completionCost: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestCount: number;
  }> {
    const where: FindOptionsWhere<TokenUsage> = { userId };

    if (filters?.apiKeyId) {
      where.apiKeyId = filters.apiKeyId;
    }

    if (filters?.appId) {
      where.appId = filters.appId;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const usages = await this.tokenUsageRepository.find({ where });

    let totalCost = 0;
    let promptCost = 0;
    let completionCost = 0;
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    for (const usage of usages) {
      const pricing = await this.getModelPricing(usage.model);

      const pCost = (usage.promptTokens / 1000) * pricing.promptPrice;
      const cCost = (usage.completionTokens / 1000) * pricing.completionPrice;

      promptCost += pCost;
      completionCost += cCost;
      totalCost += pCost + cCost;
      totalTokens += usage.totalTokens;
      promptTokens += usage.promptTokens;
      completionTokens += usage.completionTokens;
    }

    return {
      totalCost: Number(totalCost.toFixed(6)),
      promptCost: Number(promptCost.toFixed(6)),
      completionCost: Number(completionCost.toFixed(6)),
      totalTokens,
      promptTokens,
      completionTokens,
      requestCount: usages.length,
    };
  }

  async getDailyCostStats(
    userId: string,
    days: number = 30,
    filters?: {
      apiKeyId?: string;
      appId?: string;
    },
  ): Promise<
    Array<{
      date: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select('DATE(tokenUsage.createdAt)', 'date')
      .addSelect('ARRAY_AGG(tokenUsage.model)', 'models')
      .addSelect('ARRAY_AGG(tokenUsage.promptTokens)', 'promptTokens')
      .addSelect('ARRAY_AGG(tokenUsage.completionTokens)', 'completionTokens')
      .addSelect('ARRAY_AGG(tokenUsage.totalTokens)', 'totalTokens')
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

    const dailyStats: Array<{
      date: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }> = [];
    for (const item of result) {
      let totalCost = 0;
      let totalTokens = 0;
      const models = item.models || [];
      const promptTokensArr = item.prompttokens || [];
      const completionTokensArr = item.completiontokens || [];
      const totalTokensArr = item.totaltokens || [];

      for (let i = 0; i < models.length; i++) {
        const pricing = await this.getModelPricing(models[i]);
        const pCost = (Number(promptTokensArr[i]) / 1000) * pricing.promptPrice;
        const cCost =
          (Number(completionTokensArr[i]) / 1000) * pricing.completionPrice;
        totalCost += pCost + cCost;
        totalTokens += Number(totalTokensArr[i]) || 0;
      }

      dailyStats.push({
        date: item.date as string,
        totalCost: Number(totalCost.toFixed(6)),
        totalTokens,
        requestCount: Number(item.requestcount) || 0,
      });
    }

    return dailyStats;
  }

  async getMonthlyCostStats(
    userId: string,
    months: number = 12,
    filters?: {
      apiKeyId?: string;
      appId?: string;
    },
  ): Promise<
    Array<{
      month: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>
  > {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select("TO_CHAR(tokenUsage.createdAt, 'YYYY-MM')", 'month')
      .addSelect('ARRAY_AGG(tokenUsage.model)', 'models')
      .addSelect('ARRAY_AGG(tokenUsage.promptTokens)', 'promptTokens')
      .addSelect('ARRAY_AGG(tokenUsage.completionTokens)', 'completionTokens')
      .addSelect('ARRAY_AGG(tokenUsage.totalTokens)', 'totalTokens')
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

    const monthlyStats: Array<{
      month: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }> = [];
    for (const item of result) {
      let totalCost = 0;
      let totalTokens = 0;
      const models = item.models || [];
      const promptTokensArr = item.prompttokens || [];
      const completionTokensArr = item.completiontokens || [];
      const totalTokensArr = item.totaltokens || [];

      for (let i = 0; i < models.length; i++) {
        const pricing = await this.getModelPricing(models[i]);
        const pCost = (Number(promptTokensArr[i]) / 1000) * pricing.promptPrice;
        const cCost =
          (Number(completionTokensArr[i]) / 1000) * pricing.completionPrice;
        totalCost += pCost + cCost;
        totalTokens += Number(totalTokensArr[i]) || 0;
      }

      monthlyStats.push({
        month: item.month as string,
        totalCost: Number(totalCost.toFixed(6)),
        totalTokens,
        requestCount: Number(item.requestcount) || 0,
      });
    }

    return monthlyStats;
  }

  async getModelCostStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      model: string | null;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>
  > {
    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select('tokenUsage.model', 'model')
      .addSelect('SUM(tokenUsage.promptTokens)', 'promptTokens')
      .addSelect('SUM(tokenUsage.completionTokens)', 'completionTokens')
      .addSelect('SUM(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('tokenUsage.userId = :userId', { userId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'tokenUsage.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const result = await queryBuilder
      .groupBy('tokenUsage.model')
      .orderBy('SUM(tokenUsage.totalTokens)', 'DESC')
      .getRawMany();

    const modelStats: Array<{
      model: string | null;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }> = [];
    for (const item of result) {
      const pricing = await this.getModelPricing(item.model);
      const promptCost =
        (Number(item.prompttokens) / 1000) * pricing.promptPrice;
      const completionCost =
        (Number(item.completiontokens) / 1000) * pricing.completionPrice;

      modelStats.push({
        model: item.model as string | null,
        totalCost: Number((promptCost + completionCost).toFixed(6)),
        totalTokens: Number(item.totaltokens) || 0,
        requestCount: Number(item.requestcount) || 0,
      });
    }

    return modelStats;
  }

  async getAppCostStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      appId: string | null;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>
  > {
    const queryBuilder = this.tokenUsageRepository
      .createQueryBuilder('tokenUsage')
      .select('tokenUsage.appId', 'appId')
      .addSelect('ARRAY_AGG(tokenUsage.model)', 'models')
      .addSelect('ARRAY_AGG(tokenUsage.promptTokens)', 'promptTokens')
      .addSelect('ARRAY_AGG(tokenUsage.completionTokens)', 'completionTokens')
      .addSelect('ARRAY_AGG(tokenUsage.totalTokens)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('tokenUsage.userId = :userId', { userId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'tokenUsage.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const result = await queryBuilder
      .groupBy('tokenUsage.appId')
      .orderBy('requestCount', 'DESC')
      .getRawMany();

    const appStats: Array<{
      appId: string | null;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }> = [];
    for (const item of result) {
      let totalCost = 0;
      let totalTokens = 0;
      const models = item.models || [];
      const promptTokensArr = item.prompttokens || [];
      const completionTokensArr = item.completiontokens || [];
      const totalTokensArr = item.totaltokens || [];

      for (let i = 0; i < models.length; i++) {
        const pricing = await this.getModelPricing(models[i]);
        const pCost = (Number(promptTokensArr[i]) / 1000) * pricing.promptPrice;
        const cCost =
          (Number(completionTokensArr[i]) / 1000) * pricing.completionPrice;
        totalCost += pCost + cCost;
        totalTokens += Number(totalTokensArr[i]) || 0;
      }

      appStats.push({
        appId: item.appId as string | null,
        totalCost: Number(totalCost.toFixed(6)),
        totalTokens,
        requestCount: Number(item.requestcount) || 0,
      });
    }

    return appStats;
  }
}
