import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';

@Injectable()
export class SystemPromptExecutor extends BaseExecutor {
  execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const prompt = String(node.data.content ?? node.data.prompt ?? '');
    context.systemPrompt = this.interpolate(prompt, context);
    context.nodeOutputs[node.id] = context.systemPrompt;
    return Promise.resolve(context);
  }
}
