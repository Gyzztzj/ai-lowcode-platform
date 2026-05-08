/**
 * 结束节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const EndNode = ({ data }: NodeProps) => {
  const nodeData = data as any;
  return (
    <BaseNode
      title={nodeData?.label || "结束"}
      headerStyle={{ backgroundColor: "#fef2f2" }}
      titleStyle={{ color: "#dc2626" }}
      hasOutput={false}
    />
  );
};

export default EndNode;
