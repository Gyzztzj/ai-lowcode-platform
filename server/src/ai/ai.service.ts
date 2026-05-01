import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ChatDto, ChatModel } from './dto/chat.dto';
import { Readable } from 'stream';
import { Model } from '../entities/model.entity';
import { ModelType } from '../entities/model-type.enum';

// 类型定义
interface Message {
  role: string;
  content: string;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    message: { content: string };
    delta?: { content: string };
    text?: string;
  }>;
  usage: Usage;
  output?: {
    text: string;
  };
  error?: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}

interface QwenStreamResponse {
  output: {
    text: string;
  };
}

type AiResponse =
  | Readable
  | {
      content: string;
      model: string;
      usage: Usage;
    };

@Injectable()
export class AiService {
  private readonly doubaoApiKey: string;
  private readonly doubaoModel: string;
  private readonly doubaoEndpoint: string;

  private readonly qwenApiKey: string;
  private readonly qwenModel: string;
  private readonly qwenEndpoint: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
  ) {
    this.doubaoApiKey = this.configService.get('DOUBAO_CHAT_API_KEY') as string;
    this.doubaoModel = this.configService.get(
      'DOUBAO_DEFAULT_CHAT_MODEL',
    ) as string;
    this.doubaoEndpoint = this.configService.get('DOUBAO_CHAT_URL') as string;

    this.qwenApiKey = this.configService.get(
      'DASHSCOPE_CHAT_API_KEY',
    ) as string;
    this.qwenModel = this.configService.get(
      'QWEN_DEFAULT_CHAT_MODEL',
    ) as string;
    this.qwenEndpoint = this.configService.get('QWEN_CHAT_URL') as string;
  }

  async chat(chatDto: ChatDto) {
    let { model = this.doubaoModel, temperature = 0.7, max_tokens } = chatDto;
    const { messages, stream = false } = chatDto;

    // 先尝试查找自定义模型
    const customModel = await this.findCustomModel(model);
    if (customModel) {
      return this.chatWithCustomModel(
        messages,
        customModel,
        stream,
        temperature,
        max_tokens,
      );
    }

    // 如果没找到自定义模型，再用原来的硬编码逻辑
    model = this.normalizeModelId(model);

    if (model.startsWith('doubao')) {
      return this.chatWithDoubao(
        messages,
        model,
        stream,
        temperature,
        max_tokens,
      );
    } else if (model.startsWith('qwen') || model.startsWith('qvq')) {
      return this.chatWithQwen(
        messages,
        model,
        stream,
        temperature,
        max_tokens,
      );
    } else {
      throw new BadRequestException(`不支持的模型: ${model}`);
    }
  }

  /**
   * 查找自定义模型
   */
  private async findCustomModel(modelId: string): Promise<Model | null> {
    try {
      const model = await this.modelRepository.findOne({
        where: [
          { id: modelId, enabled: true },
          { modelId: modelId, enabled: true },
        ],
      });
      return model;
    } catch {
      return null;
    }
  }

  /**
   * 使用自定义模型进行对话
   */
  private async chatWithCustomModel(
    messages: Message[],
    customModel: Model,
    stream: boolean,
    temperature: number = 0.7,
    max_tokens?: number,
  ): Promise<AiResponse> {
    return this.callAiApi(
      customModel.apiEndpoint,
      customModel.apiKey,
      messages,
      customModel.modelId,
      stream,
      customModel.name || customModel.provider,
      temperature,
      max_tokens,
    );
  }

  private normalizeModelId(model: ChatModel | string): string {
    const modelMap: Record<string, string> = {
      [ChatModel.QWEN_MAX]: this.qwenModel,
      [ChatModel.QWEN_MAX_2025_03_25]: this.qwenModel,
      [ChatModel.QVQ_MAX_2025_03_25]: this.qwenModel,
      [ChatModel.DOUBAO_3_5_PRO]: this.doubaoModel,
      [ChatModel.DOUBAO_SEED_2_0_PRO]: this.doubaoModel,
    };
    return modelMap[model] || model;
  }

  private async callAiApi(
    endpoint: string,
    apiKey: string,
    messages: Message[],
    model: string,
    stream: boolean,
    provider: string,
    temperature: number = 0.7,
    max_tokens?: number,
  ): Promise<AiResponse> {
    // 自动补全端点：如果不包含完整路径，自动加上 /chat/completions
    let fullEndpoint = endpoint.trim();
    if (
      !fullEndpoint.includes('/chat/completions') &&
      !fullEndpoint.includes('/embeddings')
    ) {
      fullEndpoint = fullEndpoint.endsWith('/')
        ? `${fullEndpoint}chat/completions`
        : `${fullEndpoint}/chat/completions`;
    }

    try {
      // 根据 endpoint 判断是否是千问 API，而不是根据 provider 名称
      const isQwen = endpoint.includes('dashscope.aliyuncs.com');

      const requestBody: any = {
        model,
        messages,
        stream,
        temperature,
      };

      if (max_tokens) {
        requestBody.max_tokens = max_tokens;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };

      if (isQwen) {
        headers['Accept-Encoding'] = 'identity';
        if (stream) {
          headers['X-DashScope-SSE'] = 'enable';
        }
      }

      if (stream) {
        const response = await axios.post<Readable>(fullEndpoint, requestBody, {
          headers,
          responseType: 'stream',
          decompress: true,
          validateStatus: (status) => status < 500,
        });
        return response.data;
      } else {
        const response = await axios.post<ChatCompletionResponse>(
          fullEndpoint,
          requestBody,
          {
            headers,
            responseType: 'json',
            decompress: true,
            validateStatus: (status) => status < 500,
          },
        );

        // 检查是否有错误
        if (response.data.error) {
          throw new BadRequestException(
            `${provider} API 错误：${response.data.error.message || '请求失败'}`,
          );
        }

        const content =
          response.data.choices?.[0]?.message?.content ||
          response.data.choices?.[0]?.text ||
          response.data.output?.text ||
          '';

        return {
          content,
          model: response.data.model,
          usage: response.data.usage,
        };
      }
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { error?: { message?: string } } };
      };
      throw new BadRequestException(
        `${provider} API 错误：${err.response?.data?.error?.message || err.message || '请求失败'}`,
      );
    }
  }

  private async chatWithDoubao(
    messages: Message[],
    model: string,
    stream: boolean,
    temperature: number = 0.7,
    max_tokens?: number,
  ): Promise<AiResponse> {
    return this.callAiApi(
      this.doubaoEndpoint,
      this.doubaoApiKey,
      messages,
      model,
      stream,
      '豆包',
      temperature,
      max_tokens,
    );
  }

  private async chatWithQwen(
    messages: Message[],
    model: string,
    stream: boolean,
    temperature: number = 0.7,
    max_tokens?: number,
  ): Promise<AiResponse> {
    return this.callAiApi(
      this.qwenEndpoint,
      this.qwenApiKey,
      messages,
      model,
      stream,
      '通义千问',
      temperature,
      max_tokens,
    );
  }

  getAvailableModels() {
    return [
      {
        id: ChatModel.DOUBAO_SEED_2_0_PRO,
        name: '豆包2.0 Pro',
        provider: '字节跳动',
        description: '豆包最新模型，速度快，效果好',
        type: 'CHAT',
      },
      {
        id: ChatModel.QVQ_MAX_2025_03_25,
        name: '通义千问 Max',
        provider: '阿里巴巴',
        description: '通义千问高速模型，适合日常对话',
        type: 'CHAT',
      },
      {
        id: 'doubao-embedding-vision-251215',
        name: '豆包 Embedding Text',
        provider: '字节跳动',
        description: '豆包向量模型，用于向量化和检索',
        type: 'EMBEDDING',
      },
      {
        id: 'text-embedding-v3',
        name: '通义千问 Embedding V3',
        provider: '阿里巴巴',
        description: '通义千问向量模型，用于向量化和检索',
        type: 'EMBEDDING',
      },
    ];
  }

  async streamChat(chatDto: ChatDto): Promise<Readable> {
    const {
      messages,
      model = this.doubaoModel,
      temperature = 0.7,
      max_tokens,
    } = chatDto;

    // 先尝试查找自定义模型
    const customModel = await this.findCustomModel(model);
    if (customModel) {
      const stream = (await this.chatWithCustomModel(
        messages,
        customModel,
        true,
        temperature,
        max_tokens,
      )) as Readable;
      return this.transformStreamResponse(
        stream,
        customModel.name || customModel.provider,
      );
    }

    // 如果没找到自定义模型，再用原来的硬编码逻辑
    const normalizedModel = this.normalizeModelId(model);

    let stream: Readable;
    const isQwen =
      normalizedModel.startsWith('qwen') || normalizedModel.startsWith('qvq');
    const provider = isQwen ? '通义千问' : '豆包';

    // 核心修复：强制断言为 Readable（因为这里 stream=true，一定返回流）
    if (normalizedModel.startsWith('doubao')) {
      stream = (await this.chatWithDoubao(
        messages,
        normalizedModel,
        true,
        temperature,
        max_tokens,
      )) as Readable;
    } else if (isQwen) {
      stream = (await this.chatWithQwen(
        messages,
        normalizedModel,
        true,
        temperature,
        max_tokens,
      )) as Readable;
    } else {
      throw new BadRequestException(`不支持的模型: ${normalizedModel}`);
    }

    return this.transformStreamResponse(stream, provider);
  }

  /**
   * 转换流式响应
   */
  private transformStreamResponse(
    stream: Readable,
    provider: string,
  ): Readable {
    const transformStream = new Readable({
      read() {},
    });

    let buffer = '';

    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.includes('\n\n')
        ? buffer.split('\n\n')
        : buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6).trim();
          if (data === '[DONE]') {
            transformStream.push('data: [DONE]\n\n');
            return;
          }

          try {
            // 修复 unknown 类型
            const parsed = JSON.parse(data) as
              | ChatCompletionResponse
              | QwenStreamResponse;
            let content = '';

            if ('choices' in parsed) {
              if (parsed.choices[0]?.delta?.content) {
                content = parsed.choices[0].delta.content;
              } else if (parsed.choices[0]?.message?.content) {
                content = parsed.choices[0].message.content;
              } else if (parsed.choices[0]?.text) {
                content = parsed.choices[0].text;
              }
            }

            if ('output' in parsed && parsed.output?.text) {
              content = parsed.output.text;
            }

            if (content) {
              transformStream.push(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
          }
        }
      }
    });

    stream.on('end', () => {
      transformStream.push('data: [DONE]\n\n');
    });

    stream.on('error', (error: Error) => {
      transformStream.push(
        `data: ${JSON.stringify({ error: error.message })}\n\n`,
      );
      transformStream.push('data: [DONE]\n\n');
    });

    return transformStream;
  }
}
