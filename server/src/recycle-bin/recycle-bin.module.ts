import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App, KnowledgeBase, Conversation } from '../entities';
import { RecycleBinService } from './recycle-bin.service';
import { RecycleBinController } from './recycle-bin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([App, KnowledgeBase, Conversation])],
  controllers: [RecycleBinController],
  providers: [RecycleBinService],
})
export class RecycleBinModule {}
