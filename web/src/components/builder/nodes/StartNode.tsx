/**
 * 开始节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const StartNode = ({ data }: NodeProps) => {
  const typedData = data as { label?: string };
  return (
    <BaseNode
      title={typedData?.label || "开始"}
      headerStyle={{ backgroundColor: "#f0fdf4" }}
      titleStyle={{ color: "#16a34a" }}
      hasInput={false}
    />
  );
};

export default StartNode;
