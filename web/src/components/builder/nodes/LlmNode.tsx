/**
 * 大模型节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "reactflow";

interface LlmNodeData {
  model?: string;
  label?: string;
}

const LlmNode = ({ data }: NodeProps<LlmNodeData>) => {
  return (
    <BaseNode
      title={data.label || "大模型"}
      headerStyle={{ backgroundColor: "#fff7ed" }}
      titleStyle={{ color: "#ea580c" }}
      description={<p>模型: {data.model || "未选择"}</p>}
    />
  );
};

export default LlmNode;
