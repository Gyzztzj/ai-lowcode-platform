/**
 * 系统提示词节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "reactflow";

interface SystemPromptNodeData {
  content?: string;
  prompt?: string;
  label?: string;
}

const SystemPromptNode = ({ data }: NodeProps<SystemPromptNodeData>) => {
  return (
    <BaseNode
      title={data.label || "系统提示词"}
      headerStyle={{ backgroundColor: "#faf5ff" }}
      titleStyle={{ color: "#7c3aed" }}
      description={
        <p className="line-clamp-2">
          {data.content || data.prompt || "未设置提示词"}
        </p>
      }
    />
  );
};

export default SystemPromptNode;
