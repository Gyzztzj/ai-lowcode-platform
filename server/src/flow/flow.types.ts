export interface FlowNode {
  id: string;
  type: string;
  position?: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

import { MessageRole } from '../entities';

export interface ExecutionLog {
  nodeId: string;
  nodeType: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  output: any;
}

export interface ExecutionContext {
  appId: string;
  userId: string | null;
  userInput: string;
  variables: Record<string, any>;
  systemPrompt: string;
  messages: Array<{ role: MessageRole; content: string }>;
  result: string;
  nodeOutputs: Record<string, any>;
  metadata: Record<string, any>;
  executionLog?: ExecutionLog[];
}

export interface NodeExecutor {
  execute(node: FlowNode, context: ExecutionContext): Promise<ExecutionContext>;
}

export interface ConditionBranch {
  id: string;
  label: string;
  condition: string;
  targetNodeId: string;
}

export enum NodeType {
  START = 'start',
  END = 'end',
  LLM = 'llm',
  KNOWLEDGE_BASE = 'knowledge-base',
  KNOWLEDGEBASE = 'knowledgeBase',
  SYSTEM_PROMPT = 'system-prompt',
  SYSTEMPROMPT = 'systemPrompt',
  USER_INPUT = 'user-input',
  USERINPUT = 'userInput',
  CONDITION = 'condition',
  VARIABLE_SET = 'variable-set',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not-equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not-contains',
  GREATER_THAN = 'greater-than',
  LESS_THAN = 'less-than',
  GREATER_THAN_OR_EQUAL = 'greater-than-or-equal',
  LESS_THAN_OR_EQUAL = 'less-than-or-equal',
  MATCHES_REGEX = 'matches-regex',
}
