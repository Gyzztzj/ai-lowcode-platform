/**
 * 用户输入节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const UserInputNode = ({ data }: NodeProps) => {
  const nodeData = data as any;
  return (
    <BaseNode
      title={nodeData.label || "用户输入"}
      headerStyle={{ backgroundColor: "#eff6ff" }}
      titleStyle={{ color: "#2563eb" }}
      description={<p>变量名: {nodeData.variable || "user_input"}</p>}
    />
  );
};

export default UserInputNode;
