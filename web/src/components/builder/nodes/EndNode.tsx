/**
 * 结束节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const EndNode = ({ data }: NodeProps) => {
  const typedData = data as { label?: string; output?: string };
  return (
    <BaseNode
      title={typedData?.label || "结束"}
      headerStyle={{ backgroundColor: "#fef2f2" }}
      titleStyle={{ color: "#dc2626" }}
      hasOutput={false}
    />
  );
};

export default EndNode;
