import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface RerankResult {
  index: number;
  relevance_score: number;
  document: string;
}

@Injectable()
export class RerankerService {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly model: string;
  private readonly provider: string;

  constructor(private configService: ConfigService) {
    // 尝试使用通义千问的 rerank 功能
    this.apiKey = this.configService.get(
      'DASHSCOPE_CHAT_API_KEY',
    ) as string;
    this.endpoint =
      'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank';
    this.model = 'gte-rerank-v2';
    this.provider = 'qwen';
  }

  /**
   * 对检索结果进行重排序
   */
  async rerank(
    query: string,
    documents: string[],
    topN: number = 5,
  ): Promise<RerankResult[]> {
    if (documents.length === 0) return [];

    try {
      // 先尝试通义千问的 rerank API
      const response = await axios.post(
        this.endpoint,
        {
          model: this.model,
          query: query,
          documents: documents,
          top_n: Math.min(topN, documents.length),
          return_documents: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      if (response.data.output && response.data.output.results) {
        return response.data.output.results.map((r: any) => ({
          index: r.index,
          relevance_score: r.relevance_score,
          document: r.document || '',
        }));
      }
      return response.data.results || [];
    } catch (error: any) {
      // 如果 API 调用失败，使用简单排序（按原始顺序返回）
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
  }
}
