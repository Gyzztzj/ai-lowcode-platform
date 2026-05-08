/**
 * 变量设置节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";

const VariableSetNode = ({ data }: NodeProps) => {
  const nodeData = data as any;
  if (nodeData.variables && nodeData.variables.length > 0) {
    // 过滤出有名字的变量
    const validVariables = nodeData.variables.filter((v: any) => v.name);
    
    if (validVariables.length > 0) {
      return (
        <BaseNode
          title={nodeData.label || "变量设置"}
          headerStyle={{ backgroundColor: "#f0fdf4" }}
          titleStyle={{ color: "#16a34a" }}
          description={
            <div className="space-y-1">
              {validVariables.slice(0, 3).map((variable: any, index: number) => (
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
      title={nodeData.label || "变量设置"}
      headerStyle={{ backgroundColor: "#f0fdf4" }}
      titleStyle={{ color: "#16a34a" }}
      description={<p className="line-clamp-2">未设置变量</p>}
    />
  );
};

export default VariableSetNode;
