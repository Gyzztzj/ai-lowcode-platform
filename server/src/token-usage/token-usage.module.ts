import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenUsageService } from './token-usage.service';
import { TokenUsageController } from './token-usage.controller';
import { TokenUsage } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([TokenUsage])],
  controllers: [TokenUsageController],
  providers: [TokenUsageService],
  exports: [TokenUsageService],
})
export class TokenUsageModule {}
