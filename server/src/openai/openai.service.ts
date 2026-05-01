import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import { AppsService } from '../apps/apps.service';
import { ConversationsService } from '../conversations/conversations.service';
import {
  App,
  User,
  ApiKey,
  ApiCallLog,
  ApiCallStatus,
  TokenUsage,
} from '../entities';
import { TokenUsageService } from '../token-usage/token-usage.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class OpenAiService {
  constructor(
    private appsService: AppsService,
    private conversationsService: ConversationsService,
    private tokenUsageService: TokenUsageService,
    private apiKeysService: ApiKeysService,
    @InjectRepository(ApiCallLog)
    private apiCallLogRepository: Repository<ApiCallLog>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
  ) {}

  async recordApiCall(
    userId: string,
    apiKeyId: string | null,
    appId: string | null,
    endpoint: string,
    requestBody: string,
    statusCode: number,
    status: ApiCallStatus,
    responseTimeMs: number,
    responseBody?: string,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiCallLog> {
    const log = this.apiCallLogRepository.create({
      userId,
      apiKeyId,
      appId,
      endpoint,
      requestBody,
      responseBody: responseBody || null,
      statusCode,
      status,
      errorMessage: errorMessage || null,
      responseTimeMs,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: null,
    });

    return this.apiCallLogRepository.save(log);
  }

  async createChatCompletion(
    dto: ChatCompletionDto,
    user: User,
    apiKey?: ApiKey,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const startTime = Date.now();
    let app: App | null = null;
    let result: any;
    let statusCode = 200;
    let status = ApiCallStatus.SUCCESS;
    let errorMessage: string | null = null;

    try {
      // 确定要使用的应用
      let targetAppId: string | null = null;

      if (apiKey?.appId) {
        // API 密钥绑定了应用，使用该应用
        targetAppId = apiKey.appId;
      } else if (dto.appId) {
        // 请求中指定了 appId
        targetAppId = dto.appId;
      }

      if (targetAppId) {
        // 查找应用并验证权限和状态
        app = await this.appRepository.findOne({
          where: { id: targetAppId },
        });

        if (!app) {
          throw new NotFoundException('应用不存在');
        }

        // 验证应用是否已发布（只有已发布的应用才能通过 API 密钥访问）
        if (!app.isPublic) {
          throw new ForbiddenException('应用尚未发布，无法通过 API 访问');
        }

        // 验证 API 密钥用户是否有权限访问该应用
        if (app.userId !== user.id) {
          throw new ForbiddenException('无权访问此应用');
        }
      }

      const lastMessage = dto.messages[dto.messages.length - 1];
      const userInput =
        typeof lastMessage?.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage?.content);

      if (app) {
        if (dto.stream) {
          result = await this.createStreamedResponse(app, userInput, user.id);
        } else {
          const appResult = await this.appsService.executeApp(
            app.id,
            user.id,
            userInput,
          );
          result = this.formatCompletionResponse(
            appResult,
            dto.model || app.name || 'custom-model',
            user,
            app,
            apiKey,
          );
        }
      } else {
        result = this.formatCompletionResponse(
          '请指定 appId 或使用绑定了应用的 API 密钥',
          dto.model || 'custom-model',
          user,
          null,
          apiKey,
        );
      }
    } catch (error) {
      statusCode =
        error instanceof BadRequestException
          ? 400
          : error instanceof ForbiddenException
            ? 403
            : error instanceof NotFoundException
              ? 404
              : 500;
      status = ApiCallStatus.ERROR;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const responseTimeMs = Date.now() - startTime;
      await this.recordApiCall(
        user.id,
        apiKey?.id || null,
        app?.id || null,
        '/v1/chat/completions',
        JSON.stringify(dto),
        statusCode,
        status,
        responseTimeMs,
        JSON.stringify(result),
        errorMessage || undefined,
        ipAddress,
        userAgent,
      );

      if (apiKey) {
        await this.apiKeysService.recordUsage(apiKey.id);
      }
    }

    return result;
  }

  async createStreamedResponse(
    app: App,
    userInput: string,
    userId: string,
  ): Promise<any> {
    const conversation = await this.conversationsService.create(userId, {
      appId: app.id,
      title: 'API Conversation',
    });

    return {
      id: `chatcmpl-${uuidv4()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: app.name || 'custom-model',
      choices: [
        {
          index: 0,
          delta: {
            role: 'assistant',
            content: '',
          },
          finish_reason: null,
        },
      ],
    };
  }

  formatCompletionResponse(
    content: string,
    model: string,
    user: User,
    app: App | null,
    apiKey?: ApiKey,
  ): any {
    const id = `chatcmpl-${uuidv4()}`;
    const promptTokens = this.estimateTokens(JSON.stringify(content));
    const completionTokens = this.estimateTokens(content);
    const totalTokens = promptTokens + completionTokens;

    const response = {
      id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      },
      system_fingerprint: `fp_${uuidv4().slice(0, 8)}`,
    };

    this.tokenUsageService.recordUsage({
      userId: user.id,
      appId: app?.id || null,
      apiKeyId: apiKey?.id || null,
      promptTokens,
      completionTokens,
      model,
      metadata: { chatCompletionId: id },
    });

    return response;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async listModels(user: User): Promise<any> {
    const apps = await this.appsService.findAll(user.id);
    // 只返回已发布的应用
    const publicApps = apps.filter((app) => app.isPublic);
    return {
      object: 'list',
      data: publicApps.map((app) => ({
        id: app.id,
        object: 'model',
        created: Math.floor(new Date(app.createdAt).getTime() / 1000),
        owned_by: 'user',
        name: app.name,
        description: app.description,
      })),
    };
  }

  async retrieveModel(modelId: string, user: User): Promise<any> {
    const app = await this.appsService.findOne(modelId, user.id);
    // 验证应用是否已发布
    if (!app.isPublic) {
      throw new ForbiddenException('应用尚未发布');
    }
    return {
      id: app.id,
      object: 'model',
      created: Math.floor(new Date(app.createdAt).getTime() / 1000),
      owned_by: 'user',
      name: app.name,
      description: app.description,
    };
  }
}
