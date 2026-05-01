import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Chunk } from '../entities';

interface ChunkWithVector {
  content: string;
  vector: number[];
  documentId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ChunkRepository extends Repository<Chunk> {
  constructor(private dataSource: DataSource) {
    super(Chunk, dataSource.createEntityManager());
  }

  async saveChunkWithVector(chunk: ChunkWithVector): Promise<Chunk> {
    const { content, vector, documentId, metadata } = chunk;

    const newChunk = this.create({
      content,
      vector,
      vectorCache: vector,
      metadata: metadata || null,
      documentId,
    });

    return this.save(newChunk);
  }

  async saveChunksBatch(chunks: Array<ChunkWithVector>): Promise<number> {
    if (chunks.length === 0) return 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let successCount = 0;
      for (const chunk of chunks) {
        await queryRunner.query(
          'INSERT INTO chunk (content, vector, "documentId") VALUES ($1, $2::vector, $3)',
          [chunk.content, `[${chunk.vector.join(',')}]`, chunk.documentId],
        );
        successCount++;
      }
      await queryRunner.commitTransaction();
      return successCount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async similaritySearch(
    queryVector: number[],
    knowledgeBaseId: string,
    topK: number = 20,
    similarityThreshold: number = 0.3,
  ) {
    const vectorStr = `[${queryVector.join(',')}]`;

    const results = await this.dataSource.query(
      `
      SELECT 
        c.id,
        c.content,
        c."documentId",
        c.metadata,
        d.name as document_name,
        1 - (c.vector <-> $1::vector) as similarity
      FROM 
        chunk c
      JOIN 
        document d ON c."documentId" = d.id
      WHERE 
        d."knowledgeBaseId" = $2
        AND 1 - (c.vector <-> $1::vector) >= $3
      ORDER BY 
        c.vector <-> $1::vector
      LIMIT $4
      `,
      [vectorStr, knowledgeBaseId, similarityThreshold, topK],
    );

    if (results.length > 0) {
      return results;
    } else {
      // 如果没找到，尝试不设阈值的搜索，只按相似度排序
      const fallbackResults = await this.dataSource.query(
        `
        SELECT 
          c.id,
          c.content,
          c."documentId",
          c.metadata,
          d.name as document_name,
          1 - (c.vector <-> $1::vector) as similarity
        FROM 
          chunk c
        JOIN 
          document d ON c."documentId" = d.id
        WHERE 
          d."knowledgeBaseId" = $2
        ORDER BY 
          c.vector <-> $1::vector
        LIMIT $3
        `,
        [vectorStr, knowledgeBaseId, topK],
      );
      return fallbackResults;
    }
  }

  async getChunksByDocumentId(documentId: string): Promise<Chunk[]> {
    return this.find({ where: { documentId } });
  }

  async deleteChunksByDocumentId(documentId: string): Promise<void> {
    await this.delete({ documentId });
  }

  async countChunksByDocumentId(documentId: string): Promise<number> {
    return this.count({ where: { documentId } });
  }
}
