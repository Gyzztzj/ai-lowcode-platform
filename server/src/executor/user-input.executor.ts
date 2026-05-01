import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';

@Injectable()
export class UserInputExecutor extends BaseExecutor {
  execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const variableName = String(node.data.variable ?? 'user_input');
    context.variables[variableName] = context.userInput;
    // 设置节点输出
    context.nodeOutputs[node.id] = context.userInput;
    return Promise.resolve(context);
  }
}
