import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../entities';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
  ) {}

  async findAll() {
    return this.systemConfigRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findPublicConfigs() {
    return this.systemConfigRepository.find({
      where: { isPublic: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByKey(key: string) {
    const config = await this.systemConfigRepository.findOne({
      where: { key },
    });
    if (!config) {
      throw new NotFoundException(`配置 ${key} 不存在`);
    }
    return config;
  }

  async create(createConfigDto: {
    key: string;
    value: string;
    description?: string;
    isPublic?: boolean;
    updatedBy?: string;
  }) {
    const existing = await this.systemConfigRepository.findOne({
      where: { key: createConfigDto.key },
    });
    if (existing) {
      throw new ConflictException(`配置 ${createConfigDto.key} 已存在`);
    }
    const config = this.systemConfigRepository.create(createConfigDto);
    return this.systemConfigRepository.save(config);
  }

  async update(
    key: string,
    updateConfigDto: {
      value?: string;
      description?: string;
      isPublic?: boolean;
      updatedBy?: string;
    },
  ) {
    const config = await this.findByKey(key);
    await this.systemConfigRepository.update(config.id, updateConfigDto);
    return this.findByKey(key);
  }

  async delete(key: string) {
    const config = await this.findByKey(key);
    await this.systemConfigRepository.delete(config.id);
    return config;
  }

  async getValue(key: string, defaultValue?: string): Promise<string> {
    try {
      const config = await this.findByKey(key);
      return config.value;
    } catch {
      return defaultValue ?? '';
    }
  }
}
