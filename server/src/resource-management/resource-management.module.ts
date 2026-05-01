import { Module, forwardRef } from '@nestjs/common';
import { ResourceManagementService } from './resource-management.service';
import { ResourceManagementController } from './resource-management.controller';
import { RedisModule } from '../redis/redis.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';

@Module({
  imports: [RedisModule, forwardRef(() => TokenUsageModule)],
  controllers: [ResourceManagementController],
  providers: [ResourceManagementService],
  exports: [ResourceManagementService],
})
export class ResourceManagementModule {}
