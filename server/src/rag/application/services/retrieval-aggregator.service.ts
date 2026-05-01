import { Injectable, Logger } from '@nestjs/common';
import { MultiEmbeddingService } from '../../infrastructure/embedding/multi-embedding.service';
import { ChunkRepository } from '../../../repositories/chunk.repository';
import {
  RetrievalQuery,
  RetrievalResult,
  AggregatedRetrievalResult,
} from '../../infrastructure/embedding/embedding-provider.interface';

@Injectable()
export class RetrievalAggregatorService {
  private readonly logger = new Logger(RetrievalAggregatorService.name);

  constructor(
    private readonly multiEmbeddingService: MultiEmbeddingService,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  /**
   * 执行语义检索并聚合结果
   */
  async retrieve(query: RetrievalQuery): Promise<AggregatedRetrievalResult> {
    this.logger.log(
      `Starting retrieval for query: "${query.text.substring(0, 50)}..."`,
    );

    const providers = this.multiEmbeddingService.getAvailableProviders();
    const results: RetrievalResult[] = [];

    try {
      // 创建查询向量
      const queryEmbedding = await this.multiEmbeddingService.createEmbedding(
        query.text,
      );

      // 执行检索
      const rawResults = await this.chunkRepository.similaritySearch(
        queryEmbedding,
        query.knowledgeBaseId,
        query.topK || 20,
        query.similarityThreshold || 0.3,
      );

      // 转换结果格式
      const processedResults: RetrievalResult[] = rawResults.map(
        (result: any) => ({
          content: result.content,
          documentName: result.document_name,
          documentId: result.documentId,
          similarity: result.similarity,
          metadata: result.metadata || {},
          provider: providers[0], // 当前优先使用第一个可用的提供商
        }),
      );

      results.push(...processedResults);

      // 按相似度排序
      results.sort((a, b) => b.similarity - a.similarity);

      this.logger.log(`Retrieved ${results.length} results`);
    } catch (error) {
      this.logger.error(`Retrieval failed: ${(error as Error).message}`);
      throw error;
    }

    return {
      results,
      totalCount: results.length,
      providers: [providers[0]],
    };
  }

  /**
   * 执行重排序的检索
   */
  async retrieveWithRerank(
    query: RetrievalQuery,
    topN: number = 5,
  ): Promise<AggregatedRetrievalResult> {
    const aggregatedResult = await this.retrieve(query);

    if (aggregatedResult.results.length === 0) {
      return aggregatedResult;
    }

    // 截取 topN 结果
    const topResults = aggregatedResult.results.slice(0, topN);

    return {
      ...aggregatedResult,
      results: topResults,
      totalCount: topResults.length,
    };
  }

  /**
   * 从检索结果构建上下文
   */
  buildContextFromRetrieval(results: RetrievalResult[]): string {
    if (results.length === 0) {
      return '';
    }

    return results
      .map(
        (r, i) =>
          `[文档 ${i + 1}: ${r.documentName}] (相似度: ${r.similarity.toFixed(4)})\n${r.content}`,
      )
      .join('\n\n');
  }
}
