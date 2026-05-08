/**
 * 重排序服务（用于对检索结果进行重排序）
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RerankModel, RerankResult } from './dto/rerank.dto';

@Injectable()
export class RerankerService {
  private readonly logger = new Logger(RerankerService.name);
  private readonly apiKey: string;
  private readonly defaultModel: string;

  // 不同模型的 API 端点
  private readonly endpoints = {
    [RerankModel.QWEN3_RERANK]:
      'https://dashscope.aliyuncs.com/compatible-api/v1/reranks',
    [RerankModel.QWEN3_VL_RERANK]:
      'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank',
    [RerankModel.GTE_RERANK_V2]:
      'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank',
  };

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('DASHSCOPE_CHAT_API_KEY') as string;
    this.defaultModel =
      this.configService.get('RERANK_DEFAULT_MODEL') ||
      RerankModel.QWEN3_RERANK;
  }

  /**
   * 对检索结果进行重排序
   */
  async rerank(
    query: string,
    documents: string[],
    options?: {
      model?: string;
      topN?: number;
      returnDocuments?: boolean;
      instruct?: string;
    },
  ): Promise<RerankResult[]> {
    if (documents.length === 0) return [];

    const {
      model = this.defaultModel,
      topN = 5,
      returnDocuments = false,
      instruct,
    } = options || {};

    try {
      const endpoint = this.getEndpoint(model);
      const response = await this.callRerankApi(
        endpoint,
        model,
        query,
        documents,
        topN,
        returnDocuments,
        instruct,
      );

      return this.parseResponse(response, model, documents);
    } catch (error: any) {
      this.logger.warn(
        `Rerank API call failed, falling back to simple ranking: ${error.message}`,
      );
      // 如果 API 调用失败，使用简单排序（按原始顺序返回）
      return this.fallbackRerank(documents, topN);
    }
  }

  /**
   * 获取模型对应的 API 端点
   */
  private getEndpoint(model: string): string {
    return (
      this.endpoints[model as keyof typeof this.endpoints] ||
      this.endpoints[RerankModel.QWEN3_RERANK]
    );
  }

  /**
   * 调用 rerank API
   */
  private async callRerankApi(
    endpoint: string,
    model: string,
    query: string,
    documents: string[],
    topN: number,
    returnDocuments: boolean,
    instruct?: string,
  ) {
    let requestBody: any;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    // 根据模型类型使用不同的请求格式
    if (model === RerankModel.QWEN3_RERANK) {
      // qwen3-rerank 使用兼容格式
      requestBody = {
        model,
        query,
        documents,
        top_n: Math.min(topN, documents.length),
      };
      if (instruct) {
        requestBody.instruct = instruct;
      }
    } else {
      // qwen3-vl-rerank 和 gte-rerank-v2 使用传统格式
      requestBody = {
        model,
        input: {
          query,
          documents,
        },
        parameters: {
          top_n: Math.min(topN, documents.length),
          return_documents: returnDocuments,
        },
      };
      if (instruct) {
        requestBody.parameters.instruct = instruct;
      }
    }

    this.logger.log(`Calling rerank API for model: ${model}`);

    const response = await axios.post(endpoint, requestBody, {
      headers,
      timeout: 30000,
    });

    return response.data;
  }

  /**
   * 解析 API 响应
   */
  private parseResponse(
    response: any,
    model: string,
    originalDocuments: string[],
  ): RerankResult[] {
    let results: any[];

    if (model === RerankModel.QWEN3_RERANK) {
      // qwen3-rerank 格式
      results = response.results || [];
    } else {
      // 其他模型格式
      results = response.output?.results || [];
    }

    return results.map((r: any) => ({
      index: r.index,
      relevance_score: r.relevance_score,
      document: r.document?.text || originalDocuments[r.index] || '',
    }));
  }

  /**
   * 降级方案：简单排序
   */
  private fallbackRerank(documents: string[], topN: number): RerankResult[] {
    const results: RerankResult[] = [];
    for (let i = 0; i < Math.min(topN, documents.length); i++) {
      results.push({
        index: i,
        relevance_score: 1.0 - i * 0.05,
        document: documents[i],
      });
    }
    return results;
  }

  /**
   * 获取可用的 rerank 模型列表
   */
  getAvailableModels() {
    return [
      {
        id: RerankModel.QWEN3_RERANK,
        name: '通义千问 Rerank',
        provider: '阿里巴巴',
        description: '最新的文本重排序模型，支持 100+ 语种',
        maxDocuments: 500,
        maxTokens: 4000,
      },
      {
        id: RerankModel.QWEN3_VL_RERANK,
        name: '通义千问 VL Rerank',
        provider: '阿里巴巴',
        description: '支持多模态（图片、视频）的重排序模型',
        maxDocuments: 100,
        maxTokens: 8000,
      },
      {
        id: RerankModel.GTE_RERANK_V2,
        name: 'GTE Rerank V2',
        provider: '阿里巴巴',
        description: '稳定的文本重排序模型（将于 2026-05-30 下线）',
        maxDocuments: 30000,
        maxTokens: null,
      },
    ];
  }
}
