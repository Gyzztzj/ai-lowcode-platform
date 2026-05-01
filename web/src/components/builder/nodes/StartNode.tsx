/**
 * 开始节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "reactflow";

interface StartNodeData {
  label?: string;
}

const StartNode = ({ data }: NodeProps<StartNodeData>) => {
  return (
    <BaseNode
      title={data?.label || "开始"}
      headerStyle={{ backgroundColor: "#f0fdf4" }}
      titleStyle={{ color: "#16a34a" }}
      hasInput={false}
    />
  );
};

export default StartNode;
