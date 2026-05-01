import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like } from 'typeorm';
import { AuditLog } from '../entities';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async log(data: {
    userId?: string | null;
    apiKeyId?: string | null;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    before?: Record<string, any> | null;
    after?: Record<string, any> | null;
    metadata?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    success?: boolean;
    errorMessage?: string | null;
    durationMs?: number | null;
    sessionId?: string | null;
    requestId?: string | null;
    clientId?: string | null;
  }): Promise<AuditLog> {
    try {
      const log = this.auditLogRepository.create({
        userId:
          data.userId && this.isValidUUID(data.userId) ? data.userId : null,
        apiKeyId:
          data.apiKeyId && this.isValidUUID(data.apiKeyId)
            ? data.apiKeyId
            : null,
        action: data.action,
        resourceType: data.resourceType || null,
        resourceId: data.resourceId || null,
        before: data.before || null,
        after: data.after || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        success: data.success ?? true,
        errorMessage: data.errorMessage || null,
        durationMs: data.durationMs || null,
        sessionId:
          data.sessionId && this.isValidUUID(data.sessionId)
            ? data.sessionId
            : null,
        requestId: data.requestId || null,
        clientId: data.clientId || null,
      });

      return await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error('Failed to save audit log', error);
      throw error;
    }
  }

  async findByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      action?: string;
      success?: boolean;
      sessionId?: string;
      requestId?: string;
      clientId?: string;
    },
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = { userId };

    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    }

    if (options?.action) {
      where.action = Like(`%${options.action}%`);
    }

    if (options?.success !== undefined) {
      where.success = options.success;
    }

    if (options?.sessionId) {
      where.sessionId = options.sessionId;
    }

    if (options?.requestId) {
      where.requestId = options.requestId;
    }

    if (options?.clientId) {
      where.clientId = options.clientId;
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    return { logs, total };
  }

  async findByResource(
    resourceType: string,
    resourceId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    return { logs, total };
  }

  async findByAction(
    action: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = { action: Like(`%${action}%`) };

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

  async findAll(options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
    resourceType?: string;
    success?: boolean;
    sessionId?: string;
    requestId?: string;
    clientId?: string;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.action) {
      where.action = Like(`%${options.action}%`);
    }

    if (options?.resourceType) {
      where.resourceType = options.resourceType;
    }

    if (options?.success !== undefined) {
      where.success = options.success;
    }

    if (options?.sessionId) {
      where.sessionId = options.sessionId;
    }

    if (options?.requestId) {
      where.requestId = options.requestId;
    }

    if (options?.clientId) {
      where.clientId = options.clientId;
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

  async exportLogs(options?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
  }): Promise<AuditLog[]> {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.action) {
      where.action = Like(`%${options.action}%`);
    }

    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    }

    return this.auditLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}
