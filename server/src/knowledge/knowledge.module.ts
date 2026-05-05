/**
 * 知识库模块
 * 包含知识库相关的服务、控制器和路由
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { WebCrawlerService } from './web-crawler.service';
import { AiModule } from '../ai/ai.module';
import { RAGModule } from '../rag/rag.module';
import { KnowledgeBase, Document, Chunk } from '../entities';
import { ChunkRepository } from '../repositories/chunk.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeBase, Document, Chunk]),
    AiModule,
    RAGModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, WebCrawlerService, ChunkRepository],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
