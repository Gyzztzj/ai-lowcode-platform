/**
 * 变量设置节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "reactflow";

interface VariableSetNodeData {
  variables: Array<{
    name: string;
    value: string;
    type: string;
  }>;
  label?: string;
}

const VariableSetNode = ({ data }: NodeProps<VariableSetNodeData>) => {
  if (data.variables && data.variables.length > 0) {
    // 过滤出有名字的变量
    const validVariables = data.variables.filter(v => v.name);
    
    if (validVariables.length > 0) {
      return (
        <BaseNode
          title={data.label || "变量设置"}
          headerStyle={{ backgroundColor: "#f0fdf4" }}
          titleStyle={{ color: "#16a34a" }}
          description={
            <div className="space-y-1">
              {validVariables.slice(0, 3).map((variable, index) => (
                <p key={index} className="text-sm truncate">
                  <span className="font-medium text-green-700">{variable.name}</span>
                  <span className="text-gray-500 mx-1">=</span>
                  <span className="text-gray-700">{variable.value || "未设置值"}</span>
                </p>
              ))}
              {validVariables.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{validVariables.length - 3} 个变量
                </p>
              )}
            </div>
          }
        />
      );
    }
  }

  return (
    <BaseNode
      title={data.label || "变量设置"}
      headerStyle={{ backgroundColor: "#f0fdf4" }}
      titleStyle={{ color: "#16a34a" }}
      description={<p className="line-clamp-2">未设置变量</p>}
    />
  );
};

export default VariableSetNode;
