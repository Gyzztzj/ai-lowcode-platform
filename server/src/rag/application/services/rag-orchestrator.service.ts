import { Injectable, Logger } from '@nestjs/common';
import { TextSplitterService } from '../../domain/services/text-splitter.service';
import { ChunkRepository } from '../../../repositories/chunk.repository';
import { EmbeddingService } from '../../../ai/embedding.service';

export interface RetrievalResult {
  content: string;
  documentName: string;
  documentId: string;
  similarity: number;
  metadata: any;
}

export interface RAGOptions {
  topK?: number;
  similarityThreshold?: number;
  useRerank?: boolean;
}

@Injectable()
export class RAGOrchestratorService {
  private readonly logger = new Logger(RAGOrchestratorService.name);

  constructor(
    private embeddingService: EmbeddingService,
    private textSplitter: TextSplitterService,
    private chunkRepository: ChunkRepository,
  ) {}

  async addDocumentToKnowledgeBase(
    knowledgeBaseId: string,
    documentId: string,
    documentName: string,
    content: string,
  ): Promise<{ chunkCount: number }> {
    this.logger.log(
      `Processing document ${documentName} for knowledge base ${knowledgeBaseId}`,
    );

    const chunks = this.textSplitter.splitText(content);
    this.logger.log(`Split text into ${chunks.length} chunks`);

    const texts = chunks.map((c) => c.content);
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embeddingService.createEmbedding(text);
      embeddings.push(embedding);
    }

    let successCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      try {
        await this.chunkRepository.saveChunkWithVector({
          content: chunk.content,
          vector: embedding,
          documentId: documentId,
          metadata: {
            documentName,
            chunkIndex: chunk.metadata.chunkIndex,
            totalChunks: chunks.length,
            startPosition: chunk.metadata.startPosition,
            endPosition: chunk.metadata.endPosition,
          },
        });
        successCount++;
      } catch (error) {
        this.logger.error(
          `Failed to save chunk ${i}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Successfully saved ${successCount}/${chunks.length} chunks`,
    );
    return { chunkCount: successCount };
  }

  async retrieve(
    knowledgeBaseId: string,
    query: string,
    options: RAGOptions = {},
  ): Promise<RetrievalResult[]> {
    const { topK = 20, similarityThreshold = 0.7 } = options;

    this.logger.log(`Retrieving for query: "${query.substring(0, 50)}..."`);

    const queryEmbedding = await this.embeddingService.createEmbedding(query);

    const results = await this.chunkRepository.similaritySearch(
      queryEmbedding,
      knowledgeBaseId,
      topK,
      similarityThreshold,
    );

    this.logger.log(`Retrieved ${results.length} relevant chunks`);

    return results.map((r) => ({
      content: r.content,
      documentName: r.documentName,
      documentId: r.documentId,
      similarity: r.similarity,
      metadata: r.metadata || {},
    }));
  }

  buildContextFromRetrieval(results: RetrievalResult[]): string {
    if (results.length === 0) {
      return '';
    }

    return results
      .map((r, i) => `[文档 ${i + 1}: ${r.documentName}]\n${r.content}`)
      .join('\n\n');
  }

  buildPromptWithRetrieval(
    userQuery: string,
    retrievalResults: RetrievalResult[],
    systemPrompt?: string,
  ): string {
    const context = this.buildContextFromRetrieval(retrievalResults);

    let prompt = '';

    if (systemPrompt) {
      prompt += systemPrompt + '\n\n';
    }

    if (context) {
      prompt += `请基于以下参考资料回答用户的问题：\n\n${context}\n\n`;
    } else {
      prompt += `注意：当前知识库中没有找到相关的参考资料。\n\n`;
    }

    prompt += `用户问题：${userQuery}\n\n`;

    if (context) {
      prompt += `请根据参考资料回答问题。如果参考资料中没有相关信息，请明确说明"抱歉，我在知识库中没有找到相关信息。"不要编造信息。`;
    } else {
      prompt += `请直接说明"抱歉，我在知识库中没有找到相关信息。"`;
    }

    return prompt;
  }
}
