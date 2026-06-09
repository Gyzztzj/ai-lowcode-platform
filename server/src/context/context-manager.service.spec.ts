import { Test, TestingModule } from '@nestjs/testing';
import { ContextManagerService } from './context-manager.service';
import { RedisService } from '../redis/redis.service';

describe('ContextManagerService', () => {
  let service: ContextManagerService;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextManagerService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<ContextManagerService>(ContextManagerService);
  });

  describe('createSession', () => {
    it('should create a session and return session id', async () => {
      mockRedisService.set.mockResolvedValue('OK');

      const sessionId = await service.createSession('user-1', 'app-1');

      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
      expect(mockRedisService.set).toHaveBeenCalled();
      const callArgs = mockRedisService.set.mock.calls[0];
      // callArgs[1] should be the serialized session data
      const sessionData = JSON.parse(callArgs[1]);
      expect(sessionData.userId).toBe('user-1');
      expect(sessionData.appId).toBe('app-1');
      expect(sessionData.isCompleted).toBe(false);
    });

    it('should accept initial state and TTL', async () => {
      mockRedisService.set.mockResolvedValue('OK');

      await service.createSession(
        'user-1',
        'app-1',
        {
          variables: { key: 'value' },
          systemPrompt: 'Hello',
        },
        3600,
      );

      expect(mockRedisService.set).toHaveBeenCalled();
      const callArgs = mockRedisService.set.mock.calls[0];
      expect(callArgs[2]).toBe(3600);
    });
  });

  describe('getSession', () => {
    it('should return parsed session data', async () => {
      const sessionData = {
        userId: 'user-1',
        appId: 'app-1',
        variables: {},
        nodeOutputs: {},
        messages: [],
        metadata: {},
        systemPrompt: '',
        result: '',
        isCompleted: false,
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(sessionData));

      const result = await service.getSession('session-1');

      expect(result).toEqual(sessionData);
    });

    it('should return null when session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getSession('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session and return true', async () => {
      const existingSession = {
        userId: 'user-1',
        appId: 'app-1',
        variables: { old: 'value' },
        nodeOutputs: {},
        messages: [],
        metadata: {},
        systemPrompt: '',
        result: '',
        isCompleted: false,
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(existingSession));
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.updateSession('session-1', {
        variables: { new: 'value' },
      });

      expect(result).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return false when session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.updateSession('non-existent', {
        isCompleted: true,
      });

      expect(result).toBe(false);
    });
  });

  describe('setVariable and getVariable', () => {
    it('should set and get session variables', async () => {
      const session = {
        userId: 'user-1',
        appId: 'app-1',
        variables: {},
        nodeOutputs: {},
        messages: [],
        metadata: {},
        systemPrompt: '',
        result: '',
        isCompleted: false,
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(session));
      mockRedisService.set.mockResolvedValue('OK');

      await service.setVariable('session-1', 'testKey', 'testValue');

      expect(mockRedisService.set).toHaveBeenCalled();
      const callArgs = mockRedisService.set.mock.calls[0];
      const updatedSession = JSON.parse(callArgs[1]);
      expect(updatedSession.variables.testKey).toBe('testValue');
    });

    it('should return undefined for non-existent variable', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getVariable('session-1', 'missingKey');

      expect(result).toBeUndefined();
    });
  });

  describe('completeSession', () => {
    it('should mark session as completed', async () => {
      const session = {
        userId: 'user-1',
        appId: 'app-1',
        variables: {},
        nodeOutputs: {},
        messages: [],
        metadata: {},
        systemPrompt: '',
        result: '',
        isCompleted: false,
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(session));
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.completeSession('session-1');

      expect(result).toBe(true);
    });
  });

  describe('deleteSession', () => {
    it('should delete session from Redis', async () => {
      mockRedisService.del.mockResolvedValue(1);

      await service.deleteSession('session-1');

      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('restoreExecutionContext', () => {
    it('should restore execution context from session', async () => {
      const session = {
        userId: 'user-1',
        appId: 'app-1',
        variables: { foo: 'bar' },
        nodeOutputs: { node1: { output: 'data' } },
        messages: [],
        metadata: {},
        systemPrompt: 'System',
        result: 'Done',
        isCompleted: true,
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(session));

      const context = await service.restoreExecutionContext('session-1');

      expect(context).toBeTruthy();
      expect(context!.appId).toBe('app-1');
      expect(context!.userId).toBe('user-1');
      expect(context!.variables).toEqual({ foo: 'bar' });
      expect(context!.systemPrompt).toBe('System');
      expect(context!.result).toBe('Done');
      expect(context!.nodeOutputs).toEqual({ node1: { output: 'data' } });
    });

    it('should return null when session not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.restoreExecutionContext('non-existent');

      expect(result).toBeNull();
    });
  });
});
