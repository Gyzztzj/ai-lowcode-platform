import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MultiEmbeddingService } from '../rag/infrastructure/embedding/multi-embedding.service';

export type EmbeddingProvider = 'doubao' | 'qwen' | 'local';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly multiEmbeddingService: MultiEmbeddingService) {}

  async createEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text cannot be empty');
    }

    this.logger.log(`Creating embedding for text (length: ${text.length})`);

    // 委托给 MultiEmbeddingService
    return this.multiEmbeddingService.createEmbedding(text);
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return this.multiEmbeddingService.createBatchEmbeddings(texts);
  }

  getCurrentProvider(): EmbeddingProvider {
    const status = this.multiEmbeddingService.getProviderStatus();
    const current = status.find((s) => s.isCurrent);
    return (current?.name as EmbeddingProvider) || 'local';
  }

  getProviderStatus() {
    return this.multiEmbeddingService.getProviderStatus();
  }

  getAvailableProviders(): string[] {
    return this.multiEmbeddingService.getAvailableProviders();
  }

  setProvider(providerName: EmbeddingProvider): boolean {
    // 这里可以实现提供商切换逻辑
    this.logger.log(`Provider switching requested to: ${providerName}`);
    return true;
  }
}
