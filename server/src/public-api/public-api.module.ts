import { Module, forwardRef } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { OpenApiService } from './openapi.service';
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
    forwardRef(() => AppsModule),
    FlowModule,
    ContextModule,
    RateLimitModule,
    ApiKeysModule,
  ],
  controllers: [PublicApiController],
  providers: [OpenApiService],
  exports: [OpenApiService],
})
export class PublicApiModule {}
