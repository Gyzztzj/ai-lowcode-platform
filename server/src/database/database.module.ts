import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  App,
  Conversation,
  Message,
  KnowledgeBase,
  Document,
  Chunk,
  ApiKey,
  TokenUsage,
  AuditLog,
  WorkflowSession,
  SystemConfig,
  RefreshToken,
  PasswordResetToken,
  Model,
} from '../entities';
import { SeedService } from './seed.service';
import { ChunkRepository } from '../repositories/chunk.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          User,
          App,
          Conversation,
          Message,
          KnowledgeBase,
          Document,
          Chunk,
          ApiKey,
          TokenUsage,
          AuditLog,
          WorkflowSession,
          SystemConfig,
          RefreshToken,
          PasswordResetToken,
          Model,
        ],
        synchronize: true,
        logging: process.env.NODE_ENV !== 'production',
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      App,
      Conversation,
      Message,
      KnowledgeBase,
      Document,
      Chunk,
      ApiKey,
      TokenUsage,
      AuditLog,
      WorkflowSession,
      SystemConfig,
      RefreshToken,
      PasswordResetToken,
      Model,
    ]),
  ],
  providers: [SeedService, ChunkRepository],
  exports: [TypeOrmModule, ChunkRepository],
})
export class DatabaseModule {}
