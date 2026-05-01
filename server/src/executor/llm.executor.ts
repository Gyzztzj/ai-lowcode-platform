import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';
import { AiService } from '../ai/ai.service';
import { MessageDto } from '../ai/dto/chat.dto';
import { MessageRole } from 'src/entities';

@Injectable()
export class LlmExecutor extends BaseExecutor {
  constructor(private aiService: AiService) {
    super();
  }

  async execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const model = String(node.data.model ?? 'doubao-3-5-pro');
    const temperature = Number(node.data.temperature ?? 0.7);
    const systemPromptTemplate = String(node.data.systemPrompt ?? '');
    const promptTemplate = String(node.data.prompt ?? '');

    // 构建消息列表
    const messages: MessageDto[] = [];

    // 添加系统提示词 - 优先使用节点配置的，如果没有则使用全局的
    if (systemPromptTemplate && systemPromptTemplate.trim()) {
      try {
        const systemPrompt = this.interpolate(systemPromptTemplate, context);
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      } catch (error) {
        // 渲染失败时回退到全局系统提示词
        if (context.systemPrompt) {
          messages.push({
            role: 'system',
            content: context.systemPrompt,
          });
        }
      }
    } else if (context.systemPrompt) {
      messages.push({
        role: 'system',
        content: context.systemPrompt,
      });
    }

    // 添加历史消息
    messages.push(...context.messages);

    // 处理用户消息 - 使用提示词模板或直接使用用户输入
    let userMessage = context.userInput;
    if (promptTemplate && promptTemplate.trim()) {
      try {
        // 使用基类的 interpolate 方法
        userMessage = this.interpolate(promptTemplate, context);
      } catch (error) {
        userMessage = context.userInput;
      }
    }

    // 添加处理后的用户消息
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // 调用大模型
    const response = (await this.aiService.chat({
      messages,
      model,
      stream: false,
      temperature,
    })) as { content: string };

    // 将AI回复添加到消息列表
    context.messages.push({
      role: 'assistant' as MessageRole,
      content: response.content,
    });

    // 同时也设置节点输出
    context.nodeOutputs[node.id] = response.content;

    return context;
  }
}
