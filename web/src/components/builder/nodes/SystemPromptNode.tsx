/**
 * 系统提示词节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const SystemPromptNode = ({ data }: NodeProps) => {
  const typedData = data as {
    label?: string;
    content?: string;
    prompt?: string;
  };
  return (
    <BaseNode
      title={typedData.label || "系统提示词"}
      headerStyle={{ backgroundColor: "#faf5ff" }}
      titleStyle={{ color: "#7c3aed" }}
      description={
        <p className="line-clamp-2">
          {typedData.content || typedData.prompt || "未设置提示词"}
        </p>
      }
    />
  );
};

export default SystemPromptNode;
