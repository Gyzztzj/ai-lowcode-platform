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

  async getSession(sessionId: string): Promise<WorkflowSession | null> {
    return this.workflowSessionRepository.findOne({
      where: { sessionId },
    });
  }

  async getSessionByUser(
    userId: string,
    sessionId: string,
  ): Promise<WorkflowSession | null> {
    return this.workflowSessionRepository.findOne({
      where: { sessionId, userId },
    });
  }

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

  async completeSession(sessionId: string): Promise<WorkflowSession | null> {
    return this.updateSession(sessionId, { isCompleted: true });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.workflowSessionRepository.delete({ sessionId });
  }

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

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.workflowSessionRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

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

  async getVariable(sessionId: string, key: string): Promise<any> {
    const session = await this.getSession(sessionId);
    if (!session || !session.variables) {
      return undefined;
    }

    return session.variables[key];
  }

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
