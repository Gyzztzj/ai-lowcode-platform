/**
 * 上下文管理服务
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowSession } from '../entities/workflow-session.entity';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionContext } from '../flow/flow.types';

@Injectable()
export class ContextManagerService {
  constructor(
    @InjectRepository(WorkflowSession)
    private workflowSessionRepository: Repository<WorkflowSession>,
  ) {}

  /**
   * 创建工作流会话
   * @param userId 用户ID
   * @param appId 应用ID
   * @param initialState 初始状态（可选）
   * @param ttlSeconds 过期时间（秒，默认 86400 秒）
   * @returns 创建的会话
   */
  async createSession(
    userId: string,
    appId: string,
    initialState?: Partial<ExecutionContext>,
    ttlSeconds: number = 86400,
  ): Promise<WorkflowSession> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const session = this.workflowSessionRepository.create({
      sessionId,
      userId,
      appId,
      state: initialState || {},
      variables: initialState?.variables || {},
      nodeOutputs: initialState?.nodeOutputs || {},
      messages: initialState?.messages || [],
      metadata: initialState?.metadata || {},
      isCompleted: false,
      expiresAt,
    });

    return this.workflowSessionRepository.save(session);
  }

  /**
   * 获取工作流会话
   * @param sessionId 会话ID
   * @returns 会话（如果存在）
   */
  async getSession(sessionId: string): Promise<WorkflowSession | null> {
    return this.workflowSessionRepository.findOne({
      where: { sessionId },
    });
  }

  /**
   * 获取用户的工作流会话
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @returns 会话（如果存在）
   */
  async getSessionByUser(
    userId: string,
    sessionId: string,
  ): Promise<WorkflowSession | null> {
    return this.workflowSessionRepository.findOne({
      where: { sessionId, userId },
    });
  }

  /**
   * 更新工作流会话
   * @param sessionId 会话ID
   * @param updates 更新字段
   * @returns 更新后的会话（如果存在）
   */
  async updateSession(
    sessionId: string,
    updates: Partial<WorkflowSession>,
  ): Promise<WorkflowSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    Object.assign(session, updates);
    return this.workflowSessionRepository.save(session);
  }

  /**
   * 保存上下文执行状态
   * @param sessionId 会话ID
   * @param context 上下文执行状态
   * @returns 更新后的会话（如果存在）
   */
  async saveExecutionContext(
    sessionId: string,
    context: ExecutionContext,
  ): Promise<WorkflowSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    session.variables = context.variables;
    session.nodeOutputs = context.nodeOutputs;
    session.messages = context.messages;
    session.metadata = context.metadata;
    session.state = {
      ...session.state,
      result: context.result,
      systemPrompt: context.systemPrompt,
    };

    return this.workflowSessionRepository.save(session);
  }

  /**
   * 恢复上下文执行状态
   * @param sessionId 会话ID
   * @returns 上下文执行状态（如果存在）
   */
  async restoreExecutionContext(
    sessionId: string,
  ): Promise<ExecutionContext | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return {
      appId: session.appId,
      userId: session.userId,
      userInput: '',
      variables: session.variables || {},
      systemPrompt: session.state?.systemPrompt || '',
      messages: session.messages || [],
      result: session.state?.result || '',
      nodeOutputs: session.nodeOutputs || {},
      metadata: session.metadata || {},
    };
  }

  /**
   * 完成工作流会话
   * @param sessionId 会话ID
   * @returns 更新后的会话（如果存在）
   */
  async completeSession(sessionId: string): Promise<WorkflowSession | null> {
    return this.updateSession(sessionId, { isCompleted: true });
  }

  /**
   * 删除工作流会话
   * @param sessionId 会话ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.workflowSessionRepository.delete({ sessionId });
  }

  /**
   * 获取用户的工作流会话
   * @param userId 用户ID
   * @param appId 应用ID（可选）
   * @param limit 会话数量限制（默认 50）
   * @returns 用户的工作流会话列表
   */
  async getUserSessions(
    userId: string,
    appId?: string,
    limit: number = 50,
  ): Promise<WorkflowSession[]> {
    const query = this.workflowSessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .orderBy('session.updatedAt', 'DESC')
      .limit(limit);

    if (appId) {
      query.andWhere('session.appId = :appId', { appId });
    }

    return query.getMany();
  }

  /**
   * 清理过期的工作流会话
   * @returns 清理的会话数量
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.workflowSessionRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * 设置会话变量
   * @param sessionId 会话ID
   * @param key 变量键
   * @param value 变量值
   * @returns 更新后的会话（如果存在）
   */
  async setVariable(
    sessionId: string,
    key: string,
    value: any,
  ): Promise<WorkflowSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    session.variables = session.variables || {};
    session.variables[key] = value;

    return this.workflowSessionRepository.save(session);
  }

  /**
   * 获取会话变量
   * @param sessionId 会话ID
   * @param key 变量键
   * @returns 变量值（如果存在）
   */
  async getVariable(sessionId: string, key: string): Promise<any> {
    const session = await this.getSession(sessionId);
    if (!session || !session.variables) {
      return undefined;
    }

    return session.variables[key];
  }

  /**
   * 设置全局变量
   * @param userId 用户ID
   * @param key 变量键
   * @param value 变量值
   * @returns 更新后的会话（如果存在）
   */
  async setGlobalVariable(
    userId: string,
    key: string,
    value: any,
  ): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    for (const session of sessions) {
      session.variables = session.variables || {};
      session.variables[key] = value;
      await this.workflowSessionRepository.save(session);
    }
  }
}
