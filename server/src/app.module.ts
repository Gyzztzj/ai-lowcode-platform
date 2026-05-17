import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AppsModule } from './apps/apps.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AiModule } from './ai/ai.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { OpenAiModule } from './openai/openai.module';
import { TokenUsageModule } from './token-usage/token-usage.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { AuditModule } from './audit/audit.module';
import { FlowModule } from './flow/flow.module';
import { ContextModule } from './context/context.module';
import { PublicApiModule } from './public-api/public-api.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { RAGModule } from './rag/rag.module';
import { ModelsModule } from './models/models.module';
import { RolesModule } from './roles/roles.module';
import { QuotaModule } from './quota/quota.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    AppsModule,
    KnowledgeModule,
    RAGModule,
    ConversationsModule,
    AiModule,
    ApiKeysModule,
    OpenAiModule,
    TokenUsageModule,
    RateLimitModule,
    AuditModule,
    FlowModule,
    ContextModule,
    PublicApiModule,
    SystemConfigModule,
    ModelsModule,
    RolesModule,
    QuotaModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
