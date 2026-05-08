/**
 * 数据库种子服务
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities';
import { Model } from '../entities/model.entity';
import { Role } from '../entities/role.enum';
import { ModelType } from '../entities/model-type.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly bcryptLib = bcrypt as unknown as {
    hash: (text: string, rounds: number) => Promise<string>;
  };

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
    private configService: ConfigService,
  ) {}

  /**
   * 初始化数据库种子
   */
  async onModuleInit() {
    await this.seedAdminUser();
    await this.seedDefaultModels();
  }

  /**
   * 种子管理员用户
   */
  private async seedAdminUser() {
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'Admin123!';
    const adminName = '管理员';

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      return;
    }

    const hashedPassword = await this.bcryptLib.hash(adminPassword, 10);

    const adminUser = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: Role.ADMIN,
    });

    await this.userRepository.save(adminUser);
  }

  /**
   * 种子默认模型
   */
  private async seedDefaultModels() {
    const doubaoApiKey = this.configService.get('DOUBAO_CHAT_API_KEY');
    const doubaoModel = this.configService.get('DOUBAO_DEFAULT_CHAT_MODEL');
    const doubaoEndpoint = this.configService.get('DOUBAO_CHAT_URL');

    const qwenApiKey = this.configService.get('DASHSCOPE_CHAT_API_KEY');
    const qwenModel = this.configService.get('QWEN_DEFAULT_CHAT_MODEL');
    const qwenEndpoint = this.configService.get('QWEN_CHAT_URL');

    const defaultModels = [
      {
        name: '豆包 2.0 Pro',
        modelId: doubaoModel || 'doubao-seed-2-0-pro-260215',
        provider: '字节跳动',
        type: ModelType.CHAT,
        apiKey: doubaoApiKey || '',
        apiEndpoint:
          doubaoEndpoint ||
          'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        description:
          '侧重长链路推理能力与复杂任务稳定性，适配真实业务中的复杂场景',
        enabled: true,
        isSystem: true,
      },
      {
        name: '千问 MAX',
        modelId: qwenModel || 'qvq-max-2025-03-25',
        provider: '阿里巴巴',
        type: ModelType.CHAT,
        apiKey: qwenApiKey || '',
        apiEndpoint:
          qwenEndpoint ||
          'https://dashscope.aliyuncs.com/compatible-mode/v3/chat/completions',
        description: '通义千问高速模型，适合日常对话',
        enabled: true,
        isSystem: true,
      },
      {
        name: '豆包 Embedding',
        modelId: 'doubao-embedding-vision-251215',
        provider: '字节跳动',
        type: ModelType.EMBEDDING,
        apiKey: doubaoApiKey || '',
        apiEndpoint:
          doubaoEndpoint || 'https://ark.cn-beijing.volces.com/api/v3',
        description: '豆包向量模型，用于向量化和检索',
        enabled: true,
        isSystem: true,
      },
      {
        name: '通义千问 Embedding',
        modelId: 'text-embedding-v3',
        provider: '阿里巴巴',
        type: ModelType.EMBEDDING,
        apiKey: qwenApiKey || '',
        apiEndpoint:
          qwenEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v3',
        description: '通义千问向量模型，用于向量化和检索',
        enabled: true,
        isSystem: true,
      },
    ];

    for (const modelData of defaultModels) {
      const existingModel = await this.modelRepository.findOne({
        where: { modelId: modelData.modelId, isSystem: true },
      });

      if (!existingModel) {
        const model = this.modelRepository.create(modelData);
        await this.modelRepository.save(model);
      } else {
        existingModel.apiKey = modelData.apiKey;
        existingModel.apiEndpoint = modelData.apiEndpoint;
        existingModel.name = modelData.name;
        existingModel.description = modelData.description;
        existingModel.enabled = modelData.enabled;
        existingModel.provider = modelData.provider;
        await this.modelRepository.save(existingModel);
      }
    }
  }
}
