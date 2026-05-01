import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';

@Injectable()
export class StartExecutor extends BaseExecutor {
  execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    return Promise.resolve(context);
  }
}
