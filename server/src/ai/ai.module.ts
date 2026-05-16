import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { EmbeddingService } from './embedding.service';
import { RerankerService } from './reranker.service';
import { User } from '../entities';
import { Model } from '../entities/model.entity';
import { RAGModule } from '../rag/rag.module';
import { OpenAiModule } from '../openai/openai.module';
import { QuotaModule } from '../quota/quota.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Model]),
    forwardRef(() => RAGModule),
    OpenAiModule,
    QuotaModule,
  ],
  providers: [AiService, EmbeddingService, RerankerService],
  controllers: [AiController],
  exports: [AiService, EmbeddingService, RerankerService],
})
export class AiModule {}
