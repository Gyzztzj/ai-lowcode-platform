/**
 * 流程服务
 */
import { Injectable } from '@nestjs/common';
import { FlowNode, FlowEdge, ExecutionContext, NodeType } from './flow.types';
import { ExecutorFactory } from '../factory/executor.factory';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FlowService {
  constructor(private auditService: AuditService) {}

  /**
   * 执行流程
   * @param nodes 流程节点
   * @param edges 流程边
   * @param userInput 用户输入
   * @param appId 应用ID
   * @param userId 用户ID
   * @param options 执行选项
   * @returns 执行上下文
   */
  async executeFlow(
    nodes: FlowNode[],
    edges: FlowEdge[],
    userInput: string,
    appId: string,
    userId: string | null,
    options?: {
      sessionId?: string;
      continueFromNode?: string;
      historyMessages?: Array<{ role: any; content: string }>;
      timeoutMs?: number;
    },
  ): Promise<ExecutionContext> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs || 5 * 60 * 1000; // 默认5分钟超时

    const context: ExecutionContext = {
      appId,
      userId,
      userInput,
      variables: {},
      systemPrompt: '',
      messages: options?.historyMessages || [],
      result: '',
      nodeOutputs: {},
      metadata: {
        sessionId: options?.sessionId,
        startTime,
      },
      executionLog: [],
    };

    try {
      const executionPromise = this.executeFlowWithBranching(
        nodes,
        edges,
        context,
        options?.continueFromNode,
      );

      // 超时处理
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('流程执行超时，请稍后重试或简化流程'));
        }, timeoutMs);
      });

      const executionPath = await Promise.race([
        executionPromise,
        timeoutPromise,
      ]);

      const endTime = Date.now();
      await this.auditService.log({
        userId,
        action: 'flow.execute',
        resourceType: 'app',
        resourceId: appId,
        metadata: {
          durationMs: endTime - startTime,
          nodeCount: nodes.length,
        },
        success: true,
      });

      return executionPath;
    } catch (error) {
      const endTime = Date.now();
      await this.auditService.log({
        userId,
        action: 'flow.execute',
        resourceType: 'app',
        resourceId: appId,
        metadata: {
          error: (error as Error).message,
          durationMs: endTime - startTime,
        },
        success: false,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 执行流程（支持分支）
   * @param nodes 流程节点
   * @param edges 流程边
   * @param initialContext 初始执行上下文
   * @param startNodeId 开始节点ID
   * @returns 执行上下文
   */
  private async executeFlowWithBranching(
    nodes: FlowNode[],
    edges: FlowEdge[],
    initialContext: ExecutionContext,
    startNodeId?: string,
  ): Promise<ExecutionContext> {
    let currentContext = { ...initialContext };
    let currentNodeId = startNodeId;

    if (!currentNodeId) {
      const startNode = nodes.find((n) => n.type === NodeType.START);
      if (startNode) {
        currentNodeId = startNode.id;
      }
    }

    const visitedNodes = new Set<string>();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    while (currentNodeId) {
      if (visitedNodes.has(currentNodeId)) {
        throw new Error(`检测到循环依赖: 节点 ${currentNodeId} 被重复访问`);
      }

      visitedNodes.add(currentNodeId);

      const node = nodeMap.get(currentNodeId);
      if (!node) {
        break;
      }

      const nodeStartTime = Date.now();
      currentContext = await this.executeNode(node, currentContext);
      const nodeEndTime = Date.now();

      if (currentContext.executionLog) {
        currentContext.executionLog.push({
          nodeId: node.id,
          nodeType: node.type,
          startTime: nodeStartTime,
          endTime: nodeEndTime,
          durationMs: nodeEndTime - nodeStartTime,
          output: currentContext.nodeOutputs[node.id],
        });
      }

      if (node.type === NodeType.END) {
        break;
      }

      const nextNodeId = this.getNextNodeId(
        node.id,
        edges,
        currentContext,
        nodes,
      );
      if (!nextNodeId) {
        break;
      }

      currentNodeId = nextNodeId;
    }

    return currentContext;
  }

  /**
   * 获取下一个节点ID
   * @param currentNodeId 当前节点ID
   * @param edges 流程边
   * @param context 执行上下文
   * @param nodes 流程节点
   * @returns 下一个节点ID
   */
  private getNextNodeId(
    currentNodeId: string,
    edges: FlowEdge[],
    context: ExecutionContext,
    nodes?: FlowNode[],
  ): string | null {
    const outgoingEdges = edges.filter((e) => e.source === currentNodeId);

    if (outgoingEdges.length === 0) {
      return null;
    }

    if (outgoingEdges.length === 1) {
      return outgoingEdges[0].target;
    }

    const selectedBranchId = context.metadata.selectedBranchId;

    if (selectedBranchId) {
      // 优先匹配 sourceHandle
      const branchEdge = outgoingEdges.find(
        (e) => e.sourceHandle === selectedBranchId,
      );
      if (branchEdge) {
        return branchEdge.target;
      }

      // 其次匹配 target （兼容旧版本）
      const targetMatchEdge = outgoingEdges.find(
        (e) => e.target === selectedBranchId,
      );
      if (targetMatchEdge) {
        return targetMatchEdge.target;
      }

      // 如果没有找到，尝试按分支索引匹配
      if (nodes) {
        const conditionNode = nodes.find((n) => n.id === currentNodeId);
        if (conditionNode && conditionNode.data?.branches) {
          const branches = conditionNode.data.branches as Array<any>;
          let branchIndex = -1;

          // 如果是默认分支，它的索引应该是branches.length
          if (selectedBranchId === 'default') {
            branchIndex = branches.length;
          } else {
            branchIndex = branches.findIndex((b) => b.id === selectedBranchId);
          }

          if (branchIndex !== -1 && outgoingEdges[branchIndex]) {
            return outgoingEdges[branchIndex].target;
          }
        }
      }
    }

    // 查找默认分支
    const defaultEdge = outgoingEdges.find((e) => e.sourceHandle === 'default');
    if (defaultEdge) {
      return defaultEdge.target;
    }

    // 如果都没有，返回最后一条连线（通常是默认分支的位置）
    return outgoingEdges[outgoingEdges.length - 1].target;
  }

  /**
   * 执行节点
   * @param node 节点
   * @param context 执行上下文
   * @returns 更新后的执行上下文
   */
  private async executeNode(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const executor = ExecutorFactory.getExecutor(node.type);
    const resultContext = await executor.execute(node, context);

    if (!resultContext.nodeOutputs[node.id]) {
      resultContext.nodeOutputs[node.id] = resultContext.result;
    }

    // 支持按节点标签引用（如果节点有自定义标签）
    const nodeLabel = node.data?.label;
    if (nodeLabel && typeof nodeLabel === 'string' && nodeLabel.trim()) {
      // 使用节点标签作为引用名（移除空格和特殊字符）
      const safeLabel = nodeLabel
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');
      if (safeLabel) {
        resultContext.nodeOutputs[safeLabel] =
          resultContext.nodeOutputs[node.id];
        // 同时也支持使用原始标签作为引用名
        resultContext.nodeOutputs[nodeLabel.trim()] =
          resultContext.nodeOutputs[node.id];
      }
    }

    return resultContext;
  }

  /**
   * 构建拓扑排序
   * @param nodes 流程节点
   * @param edges 流程边
   * @returns 拓扑排序后的节点ID数组
   */
  private buildTopologicalOrder(
    nodes: FlowNode[],
    edges: FlowEdge[],
  ): string[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    });

    edges.forEach((edge) => {
      const targets = adjacency.get(edge.source) || [];
      targets.push(edge.target);
      adjacency.set(edge.source, targets);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const result: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighborId of neighbors) {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    if (result.length !== nodes.length) {
      throw new Error('工作流包含循环依赖，无法执行');
    }

    return result;
  }

  /**
   * 预览流程
   * @param nodes 流程节点
   * @param edges 流程边
   * @param userInput 用户输入
   * @param appId 应用ID
   * @param userId 用户ID
   * @returns 执行上下文
   */
  async previewFlow(
    nodes: FlowNode[],
    edges: FlowEdge[],
    userInput: string,
    appId: string,
    userId: string | null,
  ): Promise<ExecutionContext> {
    return this.executeFlow(nodes, edges, userInput, appId, userId);
  }

  /**
   * 执行流程（流式）
   * @param nodes 流程节点
   * @param edges 流程边
   * @param userInput 用户输入
   * @param appId 应用ID
   * @param userId 用户ID
   * @returns 流式响应
   */
  async executeFlowStream(
    nodes: FlowNode[],
    edges: FlowEdge[],
    userInput: string,
    appId: string,
    userId: string | null,
  ): Promise<NodeJS.ReadableStream> {
    const { Readable } = await import('stream');

    const startNode = nodes.find((n) => n.type === NodeType.START);
    if (!startNode) {
      const errorStream = new Readable({ read() {} });
      errorStream.push(
        `data: ${JSON.stringify({ error: '缺少开始节点' })}\n\n`,
      );
      errorStream.push('data: [DONE]\n\n');
      errorStream.push(null);
      return errorStream;
    }

    const llmNode = nodes.find((n) => n.type === NodeType.LLM);
    if (!llmNode) {
      const errorStream = new Readable({ read() {} });
      errorStream.push(`data: ${JSON.stringify({ error: '缺少LLM节点' })}\n\n`);
      errorStream.push('data: [DONE]\n\n');
      errorStream.push(null);
      return errorStream;
    }

    const context: ExecutionContext = {
      appId,
      userId,
      userInput,
      variables: {},
      systemPrompt: '',
      messages: [],
      result: '',
      nodeOutputs: {},
      metadata: {
        startTime: Date.now(),
      },
      executionLog: [],
    };

    const systemPromptNode = nodes.find(
      (n) =>
        n.type === NodeType.SYSTEM_PROMPT || n.type === NodeType.SYSTEMPROMPT,
    );
    if (systemPromptNode) {
      context.systemPrompt = systemPromptNode.data?.content || '';
    }

    const llmExecutor = ExecutorFactory.getExecutor('llm');

    return (llmExecutor as any).executeStream(llmNode, context);
  }

  /**
   * 验证流程
   * @param nodes 流程节点
   * @param edges 流程边
   * @returns 验证结果
   */
  validateFlow(
    nodes: FlowNode[],
    edges: FlowEdge[],
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    const hasStart = nodes.some((n) => n.type === NodeType.START);
    if (!hasStart) {
      errors.push('工作流缺少开始节点');
    }

    const hasEnd = nodes.some((n) => n.type === NodeType.END);
    if (!hasEnd) {
      errors.push('工作流缺少结束节点');
    }

    edges.forEach((edge) => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`边 ${edge.id} 的源节点 ${edge.source} 不存在`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`边 ${edge.id} 的目标节点 ${edge.target} 不存在`);
      }
    });

    try {
      this.buildTopologicalOrder(nodes, edges);
    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
