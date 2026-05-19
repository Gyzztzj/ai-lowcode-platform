import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog } from '../entities';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    userId?: string | null;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    metadata?: Record<string, any> | null;
    ipAddress?: string | null;
    success?: boolean;
    errorMessage?: string | null;
  }): Promise<AuditLog> {
    try {
      const log = this.auditLogRepository.create({
        userId: data.userId || null,
        action: data.action,
        resourceType: data.resourceType || null,
        resourceId: data.resourceId || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        success: data.success ?? true,
        errorMessage: data.errorMessage || null,
      });

      return await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error('Failed to save audit log', error);
      throw error;
    }
  }

  async find(options?: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.resourceType) {
      where.resourceType = options.resourceType;
    }

    if (options?.resourceId) {
      where.resourceId = options.resourceId;
    }

    if (options?.action) {
      where.action = Like(`%${options.action}%`);
    }

    if (options?.success !== undefined) {
      where.success = options.success;
    }

    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    return { logs, total };
  }

  async getStats(options?: { startDate?: Date; endDate?: Date }): Promise<{
    totalLogs: number;
    successful: number;
    failed: number;
    topActions: Array<{ action: string; count: number }>;
    activeUsers: number;
  }> {
    const where: any = {};

    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    }

    const totalLogs = await this.auditLogRepository.count({ where });
    const successful = await this.auditLogRepository.count({
      where: { ...where, success: true },
    });
    const failed = await this.auditLogRepository.count({
      where: { ...where, success: false },
    });

    const actionStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where(where)
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topActions = actionStats.map((item) => ({
      action: item.action,
      count: parseInt(item.count, 10),
    }));

    const userStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.userId)', 'count')
      .where(where)
      .getRawOne();

    const activeUsers = parseInt(userStats?.count || '0', 10);

    return {
      totalLogs,
      successful,
      failed,
      topActions,
      activeUsers,
    };
  }
}
