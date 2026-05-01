import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  EmbeddingProvider,
  EmbeddingProviderConfig,
  EmbeddingInput,
  RetrievalQuery,
  RetrievalResult,
  AggregatedRetrievalResult,
} from './embedding-provider.interface';

@Injectable()
export class MultiEmbeddingService {
  private readonly logger = new Logger(MultiEmbeddingService.name);

  private providers: EmbeddingProvider[] = [];
  private currentProviderIndex: number = 0;
  private failureCounts: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { open: boolean; openUntil: number }> =
    new Map();

  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_RESET_TIME_MS = 60000;
  private readonly REQUEST_TIMEOUT_MS = 10000;

  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }

  private initializeProviders() {
    const configs = this.loadProviderConfigs();

    for (const config of configs) {
      if (!config.enabled) continue;

      if (config.name === 'doubao') {
        this.providers.push(new DoubaoEmbeddingProvider(config));
      } else if (config.name === 'qwen') {
        this.providers.push(new QwenEmbeddingProvider(config));
      } else if (config.name === 'local') {
        this.providers.push(new LocalEmbeddingProvider(config));
      }
    }

    this.providers.sort((a, b) => a.priority - b.priority);

    this.logger.log(`Initialized ${this.providers.length} embedding providers`);
    this.logProviderStatus();
  }

  private loadProviderConfigs(): EmbeddingProviderConfig[] {
    return [
      {
        name: 'doubao',
        apiKey:
          this.configService.get<string>('DOUBAO_EMBEDDING_API_KEY') ||
          this.configService.get<string>('DOUBAO_CHAT_API_KEY') ||
          '',
        model:
          this.configService.get<string>('DOUBAO_DEFAULT_EMBEDDING_MODEL') ||
          'doubao-embedding-vision-251215',
        endpoint:
          this.configService.get<string>('DOUBAO_EMBEDDING_URL') ||
          'https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal',
        priority: 1,
        enabled: true,
        dimensions:
          this.configService.get<number>('DOUBAO_EMBEDDING_DIMENSION') || 1024,
      },
      {
        name: 'qwen',
        apiKey:
          this.configService.get<string>('DASHSCOPE_EMBEDDING_API_KEY') ||
          this.configService.get<string>('DASHSCOPE_CHAT_API_KEY') ||
          '',
        model:
          this.configService.get<string>('QWEN_DEFAULT_EMBEDDING_MODEL') ||
          'text-embedding-v3',
        endpoint:
          this.configService.get<string>('QWEN_EMBEDDING_URL') ||
          'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings',
        priority: 2,
        enabled: true,
      },
      {
        name: 'local',
        priority: 99,
        enabled: true,
        dimensions: 1024,
      },
    ];
  }

  private logProviderStatus() {
    this.providers.forEach((provider, index) => {
      const status = index === this.currentProviderIndex ? ' [CURRENT]' : '';
      this.logger.log(`   - [${provider.priority}] ${provider.name}${status}`);
    });
  }

  private isCircuitBreakerOpen(providerName: string): boolean {
    const breaker = this.circuitBreakers.get(providerName);
    if (!breaker || !breaker.open) return false;

    if (Date.now() > breaker.openUntil) {
      this.circuitBreakers.set(providerName, { open: false, openUntil: 0 });
      return false;
    }

    return true;
  }

  private recordFailure(providerName: string) {
    const count = (this.failureCounts.get(providerName) || 0) + 1;
    this.failureCounts.set(providerName, count);

    if (count >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.logger.warn(`Circuit breaker OPEN for ${providerName}`);
      this.circuitBreakers.set(providerName, {
        open: true,
        openUntil: Date.now() + this.CIRCUIT_BREAKER_RESET_TIME_MS,
      });
    }
  }

  private recordSuccess(providerName: string) {
    this.failureCounts.set(providerName, 0);
  }

  private getNextAvailableProvider(): EmbeddingProvider | null {
    for (let i = 0; i < this.providers.length; i++) {
      const index = (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[index];

      if (!this.isCircuitBreakerOpen(provider.name)) {
        if (index !== this.currentProviderIndex) {
          this.logger.log(`Switching to provider: ${provider.name}`);
          this.currentProviderIndex = index;
        }
        return provider;
      }
    }

    const localProvider = this.providers.find((p) => p.name === 'local');
    return localProvider || null;
  }

  private getProviderByName(name: string): EmbeddingProvider | null {
    return this.providers.find((p) => p.name === name) || null;
  }

  async createEmbedding(input: string | EmbeddingInput): Promise<number[]> {
    const maxAttempts = this.providers.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const provider = this.getNextAvailableProvider();
      if (!provider) {
        throw new Error('No embedding providers available');
      }

      try {
        this.logger.debug(`Attempting embedding with ${provider.name}`);
        const embedding = await provider.createEmbedding(input);
        this.recordSuccess(provider.name);
        this.logger.debug(`Success with ${provider.name}`);
        return embedding;
      } catch (error) {
        this.recordFailure(provider.name);
        this.logger.warn(
          `${provider.name} failed: ${(error as Error).message}`,
        );

        if (attempt >= maxAttempts - 1) {
          this.logger.error('All providers failed');
          throw error;
        }

        this.currentProviderIndex =
          (this.currentProviderIndex + 1) % this.providers.length;
      }
    }

    throw new Error('Failed to create embedding');
  }

  async createBatchEmbeddings(
    inputs: string[] | EmbeddingInput[],
  ): Promise<number[][]> {
    const provider = this.getNextAvailableProvider();
    if (!provider) {
      throw new Error('No embedding providers available');
    }

    try {
      const embeddings = await provider.createBatchEmbeddings(inputs);
      this.recordSuccess(provider.name);
      return embeddings;
    } catch (error) {
      this.recordFailure(provider.name);

      if (provider.name !== 'local') {
        const localProvider = this.providers.find((p) => p.name === 'local');
        if (localProvider) {
          this.logger.warn('Falling back to local batch embedding');
          return localProvider.createBatchEmbeddings(inputs);
        }
      }

      throw error;
    }
  }

  getProviderStatus() {
    return this.providers.map((p) => ({
      name: p.name,
      priority: p.priority,
      isCurrent: p.name === this.providers[this.currentProviderIndex]?.name,
      circuitBreakerOpen: this.isCircuitBreakerOpen(p.name),
      failureCount: this.failureCounts.get(p.name) || 0,
    }));
  }

  getAvailableProviders(): string[] {
    return this.providers.map((p) => p.name);
  }
}

class DoubaoEmbeddingProvider implements EmbeddingProvider {
  name = 'doubao';
  priority: number;
  dimensions: number;
  private readonly logger = new Logger(DoubaoEmbeddingProvider.name);

  constructor(private config: EmbeddingProviderConfig) {
    this.priority = config.priority;
    this.dimensions = config.dimensions || 1024;
  }

  async createEmbedding(input: string | EmbeddingInput): Promise<number[]> {
    const text = typeof input === 'string' ? input : input.text || '';

    this.logger.debug(
      `Calling Doubao embedding API at ${this.config.endpoint} with model ${this.config.model}`,
    );

    const requestBody: any = {
      model: this.config.model,
      input: text,
      encoding_format: 'float',
      dimensions: this.dimensions,
    };

    if (this.config.instructions) {
      requestBody.instructions = this.config.instructions;
    }

    if (this.config.sparseEmbedding) {
      requestBody.sparse_embedding = { type: 'enabled' };
    }

    this.logger.debug(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await axios.post(
      this.config.endpoint as string,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        timeout: 30000,
      },
    );

    this.logger.debug(`Doubao API response: ${JSON.stringify(response.data)}`);

    // 处理不同的响应格式
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].embedding;
    } else if (response.data.data && response.data.data.embedding) {
      return response.data.data.embedding;
    }
    throw new Error('Invalid response format from Doubao embedding API');
  }

  async createBatchEmbeddings(
    inputs: string[] | EmbeddingInput[],
  ): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const input of inputs) {
      const embedding = await this.createEmbedding(input);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.config.apiKey && this.config.endpoint);
  }

  private normalizeInput(input: string | EmbeddingInput): EmbeddingInput[] {
    if (typeof input === 'string') {
      return [{ type: 'text', text: input }];
    }
    return [input];
  }
}

class QwenEmbeddingProvider implements EmbeddingProvider {
  name = 'qwen';
  priority: number;
  private readonly logger = new Logger(QwenEmbeddingProvider.name);

  constructor(private config: EmbeddingProviderConfig) {
    this.priority = config.priority;
  }

  async createEmbedding(input: string | EmbeddingInput): Promise<number[]> {
    const text = typeof input === 'string' ? input : input.text || '';

    const response = await axios.post(
      this.config.endpoint as string,
      {
        model: this.config.model,
        input: text,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        timeout: 10000,
      },
    );
    return response.data.data[0].embedding;
  }

  async createBatchEmbeddings(
    inputs: string[] | EmbeddingInput[],
  ): Promise<number[][]> {
    const texts = inputs.map((input) =>
      typeof input === 'string' ? input : input.text || '',
    );

    const response = await axios.post(
      this.config.endpoint as string,
      {
        model: this.config.model,
        input: texts,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        timeout: 30000,
      },
    );

    const embeddings: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
      const data = response.data.data.find((d: any) => d.index === i);
      embeddings.push(data ? data.embedding : []);
    }
    return embeddings;
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.config.apiKey && this.config.endpoint);
  }
}

class LocalEmbeddingProvider implements EmbeddingProvider {
  name = 'local';
  priority: number;
  dimensions: number;
  private readonly logger = new Logger(LocalEmbeddingProvider.name);

  constructor(private config: EmbeddingProviderConfig) {
    this.priority = config.priority;
    this.dimensions = config.dimensions || 1024;
  }

  createEmbedding(input: string | EmbeddingInput): Promise<number[]> {
    const text = typeof input === 'string' ? input : input.text || '';
    return Promise.resolve(this.generateLocalEmbedding(text));
  }

  createBatchEmbeddings(
    inputs: string[] | EmbeddingInput[],
  ): Promise<number[][]> {
    const texts = inputs.map((input) =>
      typeof input === 'string' ? input : input.text || '',
    );
    return Promise.resolve(texts.map((t) => this.generateLocalEmbedding(t)));
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private generateLocalEmbedding(text: string, dimension?: number): number[] {
    const dim = dimension || this.dimensions;
    const embedding = new Array(dim).fill(0);

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      for (let j = 0; j < Math.min(4, dim); j++) {
        const pos = (i * 7 + j) % dim;
        embedding[pos] += ((charCode >> (j * 8)) & 0xff) / 255;
      }
    }

    for (let i = 0; i < text.length - 1; i++) {
      const bigram = text.charCodeAt(i) * 256 + text.charCodeAt(i + 1);
      const pos = (bigram * 13) % dim;
      embedding[pos] += 0.5;
    }

    const max = Math.max(...embedding.map(Math.abs), 1);
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = (embedding[i] / max) * 2 - 1;
    }

    return embedding;
  }
}
