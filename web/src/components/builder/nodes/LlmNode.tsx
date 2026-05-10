/**
 * 大模型节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const LlmNode = ({ data }: NodeProps) => {
  const typedData = data as {
    label?: string;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    prompt?: string;
  };
  return (
    <BaseNode
      title={typedData.label || "大模型"}
      headerStyle={{ backgroundColor: "#fff7ed" }}
      titleStyle={{ color: "#ea580c" }}
      description={<p>模型: {typedData.model || "未选择"}</p>}
    />
  );
};

export default LlmNode;
