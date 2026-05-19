import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { ContextManagerService } from './context-manager.service';
import { TemplateEngine } from '../utils/template-engine.util';

@Module({
  imports: [RedisModule],
  providers: [ContextManagerService, TemplateEngine],
  exports: [ContextManagerService, TemplateEngine],
})
export class ContextModule {}
