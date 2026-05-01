import { Module, forwardRef } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { AuditModule } from '../audit/audit.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';
import { AppsModule } from '../apps/apps.module';
import { FlowModule } from '../flow/flow.module';
import { ContextModule } from '../context/context.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    forwardRef(() => AuditModule),
    TokenUsageModule,
    AppsModule,
    FlowModule,
    ContextModule,
    RateLimitModule,
    ApiKeysModule,
  ],
  controllers: [PublicApiController],
  exports: [],
})
export class PublicApiModule {}
