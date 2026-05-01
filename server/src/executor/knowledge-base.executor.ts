import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';
import { KnowledgeService } from '../knowledge/knowledge.service';

@Injectable()
export class KnowledgeBaseExecutor extends BaseExecutor {
  constructor(private knowledgeService: KnowledgeService) {
    super();
  }

  async execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const knowledgeBaseId =
      node.data.knowledgeBaseId || node.data.knowledgeBase;
    const customQuery = node.data.query;

    if (!knowledgeBaseId) {
      const output = {
        success: false,
        message: '未配置知识库',
        knowledgeBaseId: null,
        results: [],
      };
      context.variables['knowledge'] = '';
      context.nodeOutputs[node.id] = output;
      return context;
    }

    try {
      // 构建查询：如果配置了自定义查询则使用，否则结合历史消息和当前输入
      let queryText: string;
      if (customQuery) {
        // 对自定义查询进行插值
        queryText = this.interpolate(customQuery, context);
      } else {
        // 默认：结合历史消息和当前输入，提高检索准确度
        queryText = context.userInput;
        if (context.messages && context.messages.length > 0) {
          // 取最近3条消息作为上下文补充
          const recentHistory = context.messages.slice(-3);
          const historyText = recentHistory
            .map((m) => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
            .join('\n');
          queryText = `${historyText}\n用户: ${context.userInput}`;
        }
      }

      // 使用构建的查询进行检索
      const results = await this.knowledgeService.retrieveWithRerank(
        knowledgeBaseId as string,
        queryText,
        20,
        5,
        0,
      );

      // 格式化检索结果
      const knowledgeText =
        results.length > 0
          ? results
              .map(
                (result, index) =>
                  `[文档${index + 1}: ${result.document_name}]\n${result.content}`,
              )
              .join('\n\n')
          : '';

      // 将检索结果存入变量（同时设置多个名称以便兼容不同模板）
      context.variables['knowledge'] = knowledgeText;
      context.variables['知识库检索'] = knowledgeText;

      // 设置节点输出
      const output = {
        success: true,
        knowledgeBaseId,
        resultCount: results.length,
        results: results.map((r) => ({
          documentName: r.document_name,
          content: r.content,
          similarity: r.similarity || r.relevance_score,
        })),
      };
      context.nodeOutputs[node.id] = output;

      // 同时添加到系统提示词中
      if (results.length > 0) {
        context.systemPrompt += `\n\n请基于以下参考资料回答用户的问题。如果参考资料中没有相关信息，请直接回答"抱歉，当前技术文档中未包含该问题的相关说明，无法为您解答。"，不要编造内容。\n\n参考资料：\n${knowledgeText}`;
      } else {
        context.systemPrompt += `\n\n注意：当前知识库中未找到与用户问题相关的参考资料，请直接回答"抱歉，当前技术文档中未包含该问题的相关说明，无法为您解答。"`;
      }
    } catch (error) {
      context.variables['knowledge'] = '';
      context.nodeOutputs[node.id] = {
        success: false,
        knowledgeBaseId,
        error: (error as Error).message,
      };
      context.systemPrompt += `\n\n注意：知识库检索过程中出现错误，请直接回答"抱歉，系统检索服务暂时不可用，请稍后再试。"`;
    }

    return context;
  }
}
