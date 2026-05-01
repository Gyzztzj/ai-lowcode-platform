import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenAiService } from './openai.service';
import { OpenAiController } from './openai.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AppsModule } from '../apps/apps.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { ApiCallLog, App } from '../entities';

@Module({
  imports: [
    ApiKeysModule,
    AppsModule,
    ConversationsModule,
    TokenUsageModule,
    RateLimitModule,
    TypeOrmModule.forFeature([ApiCallLog, App]),
  ],
  controllers: [OpenAiController],
  providers: [OpenAiService],
})
export class OpenAiModule {}
