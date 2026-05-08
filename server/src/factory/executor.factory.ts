/**
 * 执行器工厂
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { NodeExecutor } from '../flow/flow.types';
import { StartExecutor } from '../executor/start.executor';
import { EndExecutor } from '../executor/end.executor';
import { SystemPromptExecutor } from '../executor/system-prompt.executor';
import { UserInputExecutor } from '../executor/user-input.executor';
import { LlmExecutor } from '../executor/llm.executor';
import { KnowledgeBaseExecutor } from '../executor/knowledge-base.executor';
import { VariableSetExecutor } from '../executor/variable-set.executor';
import { ConditionExecutor } from '../executor/condition.executor';

@Injectable()
export class ExecutorFactory implements OnModuleInit {
  private static executors: Map<string, NodeExecutor> = new Map();

  constructor(
    private startExecutor: StartExecutor,
    private endExecutor: EndExecutor,
    private systemPromptExecutor: SystemPromptExecutor,
    private userInputExecutor: UserInputExecutor,
    private llmExecutor: LlmExecutor,
    private knowledgeBaseExecutor: KnowledgeBaseExecutor,
    private variableSetExecutor: VariableSetExecutor,
    private conditionExecutor: ConditionExecutor,
  ) {}

  registerExecutor(type: string, executor: NodeExecutor) {
    ExecutorFactory.executors.set(type, executor);
  }

  static getExecutor(nodeType: string): NodeExecutor {
    const executor = ExecutorFactory.executors.get(nodeType);
    if (!executor) {
      throw new Error(`未找到节点类型 ${nodeType} 的执行器`);
    }
    return executor;
  }

  onModuleInit() {
    this.registerExecutor('start', this.startExecutor);
    this.registerExecutor('end', this.endExecutor);
    this.registerExecutor('systemPrompt', this.systemPromptExecutor);
    this.registerExecutor('userInput', this.userInputExecutor);
    this.registerExecutor('llm', this.llmExecutor);
    this.registerExecutor('knowledgeBase', this.knowledgeBaseExecutor);
    this.registerExecutor('variableSet', this.variableSetExecutor);
    this.registerExecutor('variable-set', this.variableSetExecutor);
    this.registerExecutor('condition', this.conditionExecutor);
  }
}
