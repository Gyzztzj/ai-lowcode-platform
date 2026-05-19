import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionContext } from '../flow/flow.types';

interface SessionData {
  userId: string;
  appId: string;
  variables: Record<string, any>;
  nodeOutputs: Record<string, any>;
  messages: any[];
  metadata: Record<string, any>;
  systemPrompt: string;
  result: string;
  isCompleted: boolean;
}

@Injectable()
export class ContextManagerService {
  private SESSION_PREFIX = 'workflow:session:';

  constructor(private redisService: RedisService) {}

  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  async createSession(
    userId: string,
    appId: string,
    initialState?: Partial<ExecutionContext>,
    ttlSeconds: number = 86400,
  ): Promise<string> {
    const sessionId = uuidv4();
    const sessionData: SessionData = {
      userId,
      appId,
      variables: initialState?.variables || {},
      nodeOutputs: initialState?.nodeOutputs || {},
      messages: initialState?.messages || [],
      metadata: initialState?.metadata || {},
      systemPrompt: initialState?.systemPrompt || '',
      result: initialState?.result || '',
      isCompleted: false,
    };

    const key = this.getSessionKey(sessionId);
    await this.redisService.set(key, JSON.stringify(sessionData), ttlSeconds);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = this.getSessionKey(sessionId);
    const data = await this.redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const updatedSession: SessionData = { ...session, ...updates };
    const key = this.getSessionKey(sessionId);
    await this.redisService.set(key, JSON.stringify(updatedSession));
    return true;
  }

  async saveExecutionContext(
    sessionId: string,
    context: ExecutionContext,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const updatedSession: SessionData = {
      ...session,
      variables: context.variables || {},
      nodeOutputs: context.nodeOutputs || {},
      messages: context.messages || [],
      metadata: context.metadata || {},
      systemPrompt: context.systemPrompt || '',
      result: context.result || '',
    };

    const key = this.getSessionKey(sessionId);
    await this.redisService.set(key, JSON.stringify(updatedSession));
    return true;
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
      systemPrompt: session.systemPrompt || '',
      messages: session.messages || [],
      result: session.result || '',
      nodeOutputs: session.nodeOutputs || {},
      metadata: session.metadata || {},
    };
  }

  async completeSession(sessionId: string): Promise<boolean> {
    return this.updateSession(sessionId, { isCompleted: true });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.redisService.del(key);
  }

  async setVariable(
    sessionId: string,
    key: string,
    value: any,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    session.variables = session.variables || {};
    session.variables[key] = value;

    const sessionKey = this.getSessionKey(sessionId);
    await this.redisService.set(sessionKey, JSON.stringify(session));
    return true;
  }

  async getVariable(sessionId: string, key: string): Promise<any> {
    const session = await this.getSession(sessionId);
    if (!session || !session.variables) {
      return undefined;
    }
    return session.variables[key];
  }
}
