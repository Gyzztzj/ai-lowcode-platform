/**
 * 嵌入服务（向量模型）
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MultiEmbeddingService } from '../rag/infrastructure/embedding/multi-embedding.service';

export type EmbeddingProvider = 'doubao' | 'qwen' | 'local';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly multiEmbeddingService: MultiEmbeddingService) {}

  /**
   * 创建文本的向量表示
   * @param text 要向量化的文本
   * @returns 向量表示
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text cannot be empty');
    }

    this.logger.log(`Creating embedding for text (length: ${text.length})`);

    // 委托给 MultiEmbeddingService
    return this.multiEmbeddingService.createEmbedding(text);
  }

  /**
   * 创建批量文本的向量表示
   * @param texts 要向量化的文本列表
   * @returns 向量表示列表
   */
  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return this.multiEmbeddingService.createBatchEmbeddings(texts);
  }

  /**
   * 获取当前使用的提供商
   * @returns 当前提供商
   */
  getCurrentProvider(): EmbeddingProvider {
    const status = this.multiEmbeddingService.getProviderStatus();
    const current = status.find((s) => s.isCurrent);
    return (current?.name as EmbeddingProvider) || 'local';
  }

  /**
   * 获取提供商状态
   * @returns 提供商状态列表
   */
  getProviderStatus() {
    return this.multiEmbeddingService.getProviderStatus();
  }

  /**
   * 获取可用的提供商
   * @returns 可用的提供商列表
   */
  getAvailableProviders(): string[] {
    return this.multiEmbeddingService.getAvailableProviders();
  }

  /**
   * 切换提供商
   * @param providerName 要切换到的提供商
   * @returns 是否切换成功
   */
  setProvider(providerName: EmbeddingProvider): boolean {
    // 这里可以实现提供商切换逻辑
    this.logger.log(`Provider switching requested to: ${providerName}`);
    return true;
  }
}
