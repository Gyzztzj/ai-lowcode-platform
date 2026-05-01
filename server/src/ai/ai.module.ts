import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { EmbeddingService } from './embedding.service';
import { RerankerService } from './reranker.service';
import { PythonService } from './python.service';
import { User } from '../entities';
import { Model } from '../entities/model.entity';
import { RAGModule } from '../rag/rag.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Model]),
    forwardRef(() => RAGModule),
  ],
  providers: [AiService, EmbeddingService, RerankerService, PythonService],
  controllers: [AiController],
  exports: [AiService, EmbeddingService, RerankerService, PythonService],
})
export class AiModule {}
