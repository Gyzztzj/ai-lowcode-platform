import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';

@Injectable()
export class EndExecutor extends BaseExecutor {
  execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    // 优先使用结束节点配置的输出
    if (node.data?.output) {
      context.result = String(node.data.output);
      context.nodeOutputs[node.id] = context.result;
      return Promise.resolve(context);
    }

    // 然后尝试从 messages 获取最后一条消息
    if (context.messages.length > 0) {
      const lastMessage = context.messages[context.messages.length - 1];
      if (lastMessage.content) {
        context.result = lastMessage.content;
        context.nodeOutputs[node.id] = context.result;
        return Promise.resolve(context);
      }
    }

    // 最后尝试从 nodeOutputs 获取最后一个有输出的节点，使用执行日志顺序
    if (context.executionLog && context.executionLog.length > 0) {
      // 倒序查找最后一个不是 end 类型且有输出的节点
      for (let i = context.executionLog.length - 1; i >= 0; i--) {
        const logEntry = context.executionLog[i];
        if (logEntry.nodeType !== 'end' && logEntry.output) {
          context.result = String(logEntry.output);
          context.nodeOutputs[node.id] = context.result;
          return Promise.resolve(context);
        }
      }
    }

    // 如果都没有，至少设置一个默认值
    if (!context.result) {
      context.result = '🎉 恭喜！工作流测试成功！这是固定输出内容。';
    }

    context.nodeOutputs[node.id] = context.result;

    return Promise.resolve(context);
  }
}
