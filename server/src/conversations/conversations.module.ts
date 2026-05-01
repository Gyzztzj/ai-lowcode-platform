import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AiModule } from '../ai/ai.module';
import { AppsModule } from '../apps/apps.module';
import { Conversation, Message, App } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, App]),
    AiModule,
    AppsModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
