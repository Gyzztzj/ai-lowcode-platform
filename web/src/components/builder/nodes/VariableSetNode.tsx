/**
 * 变量设置节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";
import type { Variable } from "./types";

interface VariableDef extends Variable {
  type?: string;
}

const VariableSetNode = ({ data }: NodeProps) => {
  const typedData = data as {
    label?: string;
    variable?: string;
    value?: string;
    variables?: VariableDef[];
  };
  if (typedData.variables && typedData.variables.length > 0) {
    // 过滤出有名字的变量
    const validVariables = typedData.variables.filter(
      (v: VariableDef) => v.name,
    );

    if (validVariables.length > 0) {
      return (
        <BaseNode
          title={typedData.label || "变量设置"}
          headerStyle={{ backgroundColor: "#f0fdf4" }}
          titleStyle={{ color: "#16a34a" }}
          description={
            <div className="space-y-1">
              {validVariables
                .slice(0, 3)
                .map((variable: VariableDef, index: number) => (
                  <p key={index} className="text-sm truncate">
                    <span className="font-medium text-green-700">
                      {variable.name}
                    </span>
                    <span className="text-gray-500 mx-1">=</span>
                    <span className="text-gray-700">
                      {variable.value || "未设置值"}
                    </span>
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
      title={typedData.label || "变量设置"}
      headerStyle={{ backgroundColor: "#f0fdf4" }}
      titleStyle={{ color: "#16a34a" }}
      description={<p className="line-clamp-2">未设置变量</p>}
    />
  );
};

export default VariableSetNode;
