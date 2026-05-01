export interface EmbeddingInput {
  type: 'text' | 'image_url' | 'video_url';
  text?: string;
  image_url?: { url: string };
  video_url?: { url: string };
}

export interface EmbeddingResult {
  embedding: number[];
  sparse_embedding?: Array<{ index: number; value: number }>;
}

export interface EmbeddingProvider {
  name: string;
  priority: number;

  createEmbedding(input: string | EmbeddingInput): Promise<number[]>;
  createBatchEmbeddings(
    inputs: string[] | EmbeddingInput[],
  ): Promise<number[][]>;

  isAvailable(): Promise<boolean>;
}

export interface EmbeddingProviderConfig {
  name: string;
  apiKey?: string;
  model?: string;
  endpoint?: string;
  priority: number;
  enabled: boolean;
  dimensions?: number;
  sparseEmbedding?: boolean;
  instructions?: string;
}

export interface RetrievalQuery {
  text: string;
  knowledgeBaseId: string;
  topK?: number;
  similarityThreshold?: number;
  provider?: string;
}

export interface RetrievalResult {
  content: string;
  documentName: string;
  documentId: string;
  similarity: number;
  metadata: any;
  provider?: string;
}

export interface AggregatedRetrievalResult {
  results: RetrievalResult[];
  totalCount: number;
  providers: string[];
}
