import { Module, forwardRef } from '@nestjs/common';
import { FlowService } from './flow.service';
import { ExecutorFactory } from '../factory/executor.factory';
import { StartExecutor } from '../executor/start.executor';
import { EndExecutor } from '../executor/end.executor';
import { SystemPromptExecutor } from '../executor/system-prompt.executor';
import { UserInputExecutor } from '../executor/user-input.executor';
import { LlmExecutor } from '../executor/llm.executor';
import { KnowledgeBaseExecutor } from '../executor/knowledge-base.executor';
import { VariableSetExecutor } from '../executor/variable-set.executor';
import { ConditionExecutor } from '../executor/condition.executor';
import { ExpressionEvaluator } from '../utils/expression-evaluator.util';
import { AuditModule } from '../audit/audit.module';
import { AiModule } from '../ai/ai.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ContextModule } from '../context/context.module';

@Module({
  imports: [
    forwardRef(() => AuditModule),
    AiModule,
    KnowledgeModule,
    ContextModule,
  ],
  providers: [
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
  exports: [FlowService, ExpressionEvaluator],
})
export class FlowModule {}
