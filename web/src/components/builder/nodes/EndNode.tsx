/**
 * 结束节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "reactflow";

interface EndNodeData {
  label?: string;
}

const EndNode = ({ data }: NodeProps<EndNodeData>) => {
  return (
    <BaseNode
      title={data?.label || "结束"}
      headerStyle={{ backgroundColor: "#fef2f2" }}
      titleStyle={{ color: "#dc2626" }}
      hasOutput={false}
    />
  );
};

export default EndNode;
