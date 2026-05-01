/**
 * 节点类型
 */
import StartNode from "./StartNode";
import EndNode from "./EndNode";
import SystemPromptNode from "./SystemPromptNode";
import UserInputNode from "./UserInputNode";
import LlmNode from "./LlmNode";
import KnowledgeBaseNode from "./KnowledgeBaseNode";
import ConditionNode from "./ConditionNode";
import VariableSetNode from "./VariableSetNode";

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  systemPrompt: SystemPromptNode,
  userInput: UserInputNode,
  llm: LlmNode,
  knowledgeBase: KnowledgeBaseNode,
  condition: ConditionNode,
  variableSet: VariableSetNode,
};
