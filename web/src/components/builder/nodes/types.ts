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
