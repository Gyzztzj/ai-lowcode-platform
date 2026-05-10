/**
 * 节点类型
 */
export const NodeType = {
  START: "start",
  END: "end",
  SYSTEM_PROMPT: "systemPrompt",
  USER_INPUT: "userInput",
  LLM: "llm",
  KNOWLEDGE_BASE: "knowledgeBase",
  CONDITION: "condition",
  VARIABLE_SET: "variableSet",
};

export interface NodeData {
  [key: string]: unknown;
}

export interface Branch {
  id?: string;
  label?: string;
  condition?: string;
  targetNodeId?: string;
}

export interface Variable {
  name?: string;
  value?: string;
}
