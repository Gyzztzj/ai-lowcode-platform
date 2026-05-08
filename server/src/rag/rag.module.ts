import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeBase, Document, Chunk } from '../entities';
import { ChunkRepository } from '../repositories/chunk.repository';
import { AiModule } from '../ai/ai.module';

import { RAGOrchestratorService } from './application/services/rag-orchestrator.service';
import { TextSplitterService } from './domain/services/text-splitter.service';
import { MultiEmbeddingService } from './infrastructure/embedding/multi-embedding.service';
import { RAGController } from './interfaces/controllers/rag.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([KnowledgeBase, Document, Chunk]),
    forwardRef(() => AiModule),
  ],
  controllers: [RAGController],
  providers: [
    RAGOrchestratorService,
    TextSplitterService,
    MultiEmbeddingService,
    ChunkRepository,
  ],
  exports: [
    RAGOrchestratorService,
    MultiEmbeddingService,
    TextSplitterService,
  ],
})
export class RAGModule {}
