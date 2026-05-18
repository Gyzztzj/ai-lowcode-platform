import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';
import { AiService } from '../ai/ai.service';
import { MessageDto } from '../ai/dto/chat.dto';
import { MessageRole } from '../entities';
import { Readable } from 'stream';

@Injectable()
export class LlmExecutor extends BaseExecutor {
  constructor(private aiService: AiService) {
    super();
  }

  async execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    return this.executeNonStream(node, context);
  }

  async executeNonStream(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const model = String(node.data.model ?? 'doubao-3-5-pro');
    const temperature = Number(node.data.temperature ?? 0.7);
    const systemPromptTemplate = String(node.data.systemPrompt ?? '');
    const promptTemplate = String(node.data.prompt ?? '');

    const messages = await this.buildMessages(
      node,
      context,
      systemPromptTemplate,
      promptTemplate,
    );

    const response = (await this.aiService.chat({
      messages,
      model,
      stream: false,
      temperature,
    })) as { content: string };

    context.messages.push({
      role: 'assistant' as MessageRole,
      content: response.content,
    });

    context.nodeOutputs[node.id] = response.content;

    return context;
  }

  async executeStream(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<Readable> {
    const model = String(node.data.model ?? 'doubao-3-5-pro');
    const temperature = Number(node.data.temperature ?? 0.7);
    const systemPromptTemplate = String(node.data.systemPrompt ?? '');
    const promptTemplate = String(node.data.prompt ?? '');

    const messages = await this.buildMessages(
      node,
      context,
      systemPromptTemplate,
      promptTemplate,
    );

    return this.aiService.streamChat({
      messages,
      model,
      stream: true,
      temperature,
    });
  }

  private async buildMessages(
    node: FlowNode,
    context: ExecutionContext,
    systemPromptTemplate: string,
    promptTemplate: string,
  ): Promise<MessageDto[]> {
    const messages: MessageDto[] = [];

    if (systemPromptTemplate && systemPromptTemplate.trim()) {
      try {
        const systemPrompt = this.interpolate(systemPromptTemplate, context);
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      } catch {
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

    messages.push(...context.messages);

    let userMessage = context.userInput;
    if (promptTemplate && promptTemplate.trim()) {
      try {
        userMessage = this.interpolate(promptTemplate, context);
      } catch {
        userMessage = context.userInput;
      }
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }
}
