import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { RedisService } from '../redis/redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  const mockRedisClient = {
    zremrangebyscore: jest.fn(),
    zcard: jest.fn(),
    zadd: jest.fn(),
    expire: jest.fn(),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      mockRedisClient.zcard.mockResolvedValue(5);

      const result = await service.checkRateLimit('test-user', 10, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // limit - count - 1 = 10 - 5 - 1
      expect(mockRedisClient.zadd).toHaveBeenCalled();
      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    it('should deny request when at limit', async () => {
      mockRedisClient.zcard.mockResolvedValue(10);

      const result = await service.checkRateLimit('test-user', 10, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should deny request when over limit', async () => {
      mockRedisClient.zcard.mockResolvedValue(15);

      const result = await service.checkRateLimit('test-user', 10, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should clean old entries before checking', async () => {
      mockRedisClient.zcard.mockResolvedValue(0);

      await service.checkRateLimit('test-user', 10, 60);

      expect(mockRedisClient.zremrangebyscore).toHaveBeenCalled();
    });

    it('should include reset timestamp in result', async () => {
      mockRedisClient.zcard.mockResolvedValue(0);

      const result = await service.checkRateLimit('test-user', 10, 60);

      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 61 * 1000);
    });
  });

  describe('enforceRateLimit', () => {
    it('should not throw when under limit', async () => {
      mockRedisClient.zcard.mockResolvedValue(0);

      await expect(
        service.enforceRateLimit('test-user', 10, 60),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when over limit', async () => {
      mockRedisClient.zcard.mockResolvedValue(10);

      await expect(
        service.enforceRateLimit('test-user', 10, 60),
      ).rejects.toThrow('请求频率超限');
    });
  });
});
