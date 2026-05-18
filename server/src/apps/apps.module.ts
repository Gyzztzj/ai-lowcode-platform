/**
 * 应用模块
 * 包含应用相关的服务、控制器和路由
 */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppsService } from './apps.service';
import { AppsController } from './apps.controller';
import { FlowService } from '../flow/flow.service';
import { ExecutorFactory } from '../factory/executor.factory';
import { AiModule } from '../ai/ai.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AuditModule } from '../audit/audit.module';
import { StartExecutor } from '../executor/start.executor';
import { EndExecutor } from '../executor/end.executor';
import { SystemPromptExecutor } from '../executor/system-prompt.executor';
import { UserInputExecutor } from '../executor/user-input.executor';
import { LlmExecutor } from '../executor/llm.executor';
import { KnowledgeBaseExecutor } from '../executor/knowledge-base.executor';
import { VariableSetExecutor } from '../executor/variable-set.executor';
import { ConditionExecutor } from '../executor/condition.executor';
import { ExpressionEvaluator } from '../utils/expression-evaluator.util';
import { ContextModule } from '../context/context.module';
import { PublicApiModule } from '../public-api/public-api.module';
import { App, Model } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([App, Model]),
    AiModule,
    KnowledgeModule,
    forwardRef(() => AuditModule),
    ContextModule,
    forwardRef(() => PublicApiModule),
  ],
  controllers: [AppsController],
  providers: [
    AppsService,
    FlowService,
    ExecutorFactory,
    StartExecutor,
    EndExecutor,
    SystemPromptExecutor,
    UserInputExecutor,
    LlmExecutor,
    KnowledgeBaseExecutor,
    VariableSetExecutor,
    ConditionExecutor,
    ExpressionEvaluator,
  ],
  exports: [FlowService, AppsService],
})
export class AppsModule {}
