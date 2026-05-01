import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { ApiKey, ApiKeyStatus, User, App } from '../entities';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RefreshApiKeyDto } from './dto/refresh-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private dataSource: DataSource,
  ) {}

  generateApiKey(): string {
    return `sk_${randomBytes(32).toString('hex')}`;
  }

  async create(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    const key = this.generateApiKey();

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const rateLimit =
      dto.rateLimitRequests && dto.rateLimitWindow
        ? { requests: dto.rateLimitRequests, window: dto.rateLimitWindow }
        : null;

    // 验证 appId（如果提供）
    let appId: string | null = null;
    if (dto.appId) {
      const app = await this.appRepository.findOne({
        where: { id: dto.appId },
      });
      if (!app) {
        throw new NotFoundException('应用不存在');
      }
      if (app.userId !== userId) {
        throw new ForbiddenException('无权访问此应用');
      }
      appId = dto.appId;
    }

    const apiKey = this.apiKeyRepository.create({
      name: dto.name,
      key,
      status: ApiKeyStatus.ACTIVE,
      permissions: dto.permissions || ['*'],
      expiresAt,
      rateLimit,
      description: dto.description,
      userId,
      appId,
    });

    const saved = await this.apiKeyRepository.save(apiKey);
    return { apiKey: saved, key };
  }

  async refresh(
    id: string,
    userId: string,
    dto: RefreshApiKeyDto,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    const oldKey = await this.findOne(id, userId);
    const newKey = this.generateApiKey();

    oldKey.key = newKey;
    oldKey.status = ApiKeyStatus.ACTIVE;
    if (dto.expiresAt) {
      oldKey.expiresAt = new Date(dto.expiresAt);
    }
    if (dto.permissions) {
      oldKey.permissions = dto.permissions;
    }

    const saved = await this.apiKeyRepository.save(oldKey);
    return { apiKey: saved, key: newKey };
  }

  async findAll(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['app'],
    });
  }

  async findByApp(appId: string, userId: string): Promise<ApiKey[]> {
    // 验证应用权限
    const app = await this.appRepository.findOne({
      where: { id: appId },
    });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }
    if (app.userId !== userId) {
      throw new ForbiddenException('无权访问此应用');
    }

    return this.apiKeyRepository.find({
      where: { userId, appId },
      order: { createdAt: 'DESC' },
      relations: ['app'],
    });
  }

  async findOne(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
      relations: ['app'],
    });

    if (!apiKey) {
      throw new NotFoundException('API 密钥不存在');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenException('无权访问此 API 密钥');
    }

    return apiKey;
  }

  async validateKey(
    key: string,
  ): Promise<{ valid: boolean; user?: User; apiKey?: ApiKey }> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key },
      relations: ['user', 'app'],
    });

    if (!apiKey) {
      return { valid: false };
    }

    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      return { valid: false };
    }

    if (apiKey.deletedAt) {
      return { valid: false };
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      apiKey.status = ApiKeyStatus.EXPIRED;
      await this.apiKeyRepository.save(apiKey);
      return { valid: false };
    }

    return { valid: true, user: apiKey.user, apiKey };
  }

  async recordUsage(apiKeyId: string): Promise<void> {
    await this.apiKeyRepository.update(apiKeyId, {
      lastUsedAt: new Date(),
      requestCount: () => 'requestCount + 1',
    });
  }

  async revoke(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.findOne(id, userId);
    apiKey.status = ApiKeyStatus.REVOKED;
    return this.apiKeyRepository.save(apiKey);
  }

  async activate(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.findOne(id, userId);
    if (
      apiKey.status === ApiKeyStatus.EXPIRED &&
      apiKey.expiresAt &&
      new Date() > apiKey.expiresAt
    ) {
      throw new ForbiddenException('无法激活已过期的密钥');
    }
    apiKey.status = ApiKeyStatus.ACTIVE;
    return this.apiKeyRepository.save(apiKey);
  }

  async delete(id: string, userId: string): Promise<void> {
    const apiKey = await this.findOne(id, userId);
    await this.apiKeyRepository.softDelete(id);
  }
}
