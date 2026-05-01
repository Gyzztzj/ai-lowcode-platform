/**
 * 用户输入节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "reactflow";

interface UserInputNodeData {
  variable?: string;
  label?: string;
}

const UserInputNode = ({ data }: NodeProps<UserInputNodeData>) => {
  return (
    <BaseNode
      title={data.label || "用户输入"}
      headerStyle={{ backgroundColor: "#eff6ff" }}
      titleStyle={{ color: "#2563eb" }}
      description={<p>变量名: {data.variable || "user_input"}</p>}
    />
  );
};

export default UserInputNode;
