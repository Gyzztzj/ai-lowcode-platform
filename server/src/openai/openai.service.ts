import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { MessageDto } from '../ai/dto/chat.dto';

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const baseUrl = this.configService.get<string>('OPENAI_API_BASE_URL');

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl || undefined,
      timeout: 60000,
    });
  }

  async chat(
    messages: MessageDto[],
    model: string = 'gpt-3.5-turbo',
    temperature: number = 0.7,
    max_tokens?: number,
    stream: boolean = false,
  ): Promise<Readable | { content: string; model: string; usage?: Usage }> {
    try {
      if (stream) {
        return this.streamChat(messages, model, temperature, max_tokens);
      }

      const response = await this.client.chat.completions.create({
        model,
        messages: messages,
        temperature,
        max_tokens,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        model: response.model,
        usage: response.usage
          ? {
              prompt_tokens: response.usage.prompt_tokens,
              completion_tokens: response.usage.completion_tokens,
              total_tokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      this.logger.error(`OpenAI API error: ${err.message}`);
      throw new BadRequestException(
        `OpenAI API 错误：${err.message || '请求失败'}`,
      );
    }
  }

  private async streamChat(
    messages: MessageDto[],
    model: string,
    temperature: number,
    max_tokens?: number,
  ): Promise<Readable> {
    const transformStream = new Readable({
      read() {},
    });

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: messages,
        temperature,
        max_tokens,
        stream: true,
      });

      const stream = response as unknown as AsyncIterable<{
        choices: Array<{ delta: { content?: string } }>;
      }>;

      (async () => {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              transformStream.push(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
        } catch (error) {
          transformStream.push(
            `data: ${JSON.stringify({ error: (error as Error).message })}\n\n`,
          );
        }
        transformStream.push('data: [DONE]\n\n');
      })();

      return transformStream;
    } catch (error: unknown) {
      const err = error as { message?: string };
      transformStream.push(
        `data: ${JSON.stringify({ error: err.message || '请求失败' })}\n\n`,
      );
      transformStream.push('data: [DONE]\n\n');
      return transformStream;
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        description: '快速、高效的基础模型，适合大多数场景',
        type: 'CHAT',
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        provider: 'OpenAI',
        description: '支持更长上下文的GPT-3.5模型',
        type: 'CHAT',
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        description: '更强大的模型，支持复杂推理和多模态',
        type: 'CHAT',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        description: 'GPT-4的升级版，支持更大上下文',
        type: 'CHAT',
      },
    ];
  }

  async createChatCompletion(
    dto: any,
    user: any,
    apiKey: any,
    ip: string,
    userAgent: string,
  ) {
    const messages = dto.messages || [];
    const model = dto.model || 'gpt-3.5-turbo';
    const stream = dto.stream || false;
    const temperature = dto.temperature !== undefined ? dto.temperature : 0.7;
    const max_tokens = dto.max_tokens;

    return this.chat(messages, model, temperature, max_tokens, stream);
  }

  async listModels(user: any) {
    return {
      object: 'list',
      data: this.getAvailableModels().map((m) => ({
        id: m.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'openai',
      })),
    };
  }

  async retrieveModel(modelId: string, user: any) {
    const model = this.getAvailableModels().find((m) => m.id === modelId);
    if (!model) {
      throw new BadRequestException(`Model ${modelId} not found`);
    }
    return {
      id: model.id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'openai',
    };
  }
}
