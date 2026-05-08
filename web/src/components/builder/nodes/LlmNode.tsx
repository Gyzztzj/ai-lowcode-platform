/**
 * 大模型节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const LlmNode = ({ data }: NodeProps) => {
  const nodeData = data as any;
  return (
    <BaseNode
      title={nodeData.label || "大模型"}
      headerStyle={{ backgroundColor: "#fff7ed" }}
      titleStyle={{ color: "#ea580c" }}
      description={<p>模型: {nodeData.model || "未选择"}</p>}
    />
  );
};

export default LlmNode;
