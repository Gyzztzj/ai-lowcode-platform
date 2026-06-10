import { Test, TestingModule } from '@nestjs/testing';
import { TokenUsageService } from './token-usage.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenUsage, Model } from '../entities';
import { DataSource } from 'typeorm';

describe('TokenUsageService', () => {
  let service: TokenUsageService;

  const mockTokenUsageRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockModelRepo = {
    findOne: jest.fn(),
  };

  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenUsageService,
        {
          provide: getRepositoryToken(TokenUsage),
          useValue: mockTokenUsageRepo,
        },
        {
          provide: getRepositoryToken(Model),
          useValue: mockModelRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TokenUsageService>(TokenUsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('estimateTokens', () => {
    it('should estimate token count based on text length', () => {
      expect(service.estimateTokens('')).toBe(0);
      expect(service.estimateTokens('hello')).toBe(2);
      expect(service.estimateTokens('hello world')).toBe(3);
      expect(service.estimateTokens('a')).toBe(1);
    });

    it('should return 0 for empty string', () => {
      expect(service.estimateTokens('')).toBe(0);
    });

    it('should estimate approximately 1 token per 4 characters', () => {
      const longText = 'a'.repeat(1000);
      expect(service.estimateTokens(longText)).toBe(250);
    });
  });

  describe('recordUsage', () => {
    it('should create and save a token usage record', async () => {
      const usageData = {
        userId: 'user-1',
        promptTokens: 100,
        completionTokens: 50,
      };

      const createdEntity = {
        ...usageData,
        totalTokens: 150,
        appId: null,
        apiKeyId: null,
        model: null,
        metadata: null,
      };

      mockTokenUsageRepo.create.mockReturnValue(createdEntity);
      mockTokenUsageRepo.save.mockResolvedValue({
        id: 'usage-1',
        ...createdEntity,
      });

      await service.recordUsage(usageData);

      expect(mockTokenUsageRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        appId: null,
        apiKeyId: null,
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        model: null,
        metadata: null,
      });
      expect(mockTokenUsageRepo.save).toHaveBeenCalled();
    });
  });
});
