import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { Branch } from "./types";

const ConditionNode = ({ data, selected }: NodeProps) => {
  const typedData = data as { label?: string; branches?: Branch[] };
  const branches = typedData.branches || [];

  // 确保每个分支都有稳定的id，同时创建所有分支数组
  const allBranches = [
    ...branches.map((branch: Branch, index: number) => {
      // 如果分支没有id，生成一个临时但稳定的id（基于索引）
      const safeId = branch.id || `branch-${index}`;
      return {
        ...branch,
        id: safeId,
        isDefault: false,
        displayIndex: index,
        number: index + 1,
      };
    }),
    {
      id: "default",
      label: "默认",
      isDefault: true,
      displayIndex: branches.length,
      number: branches.length + 1,
    },
  ];

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm min-w-[260px] ${selected ? "ring-2" : ""}`}
      style={selected ? { boxShadow: "0 0 0 2px #ca8a04" } : {}}
    >
      {/* 输入Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-4 h-4 border-2 border-white"
        style={{ backgroundColor: "#ca8a04" }}
      />

      {/* 标题 */}
      <div
        className="px-4 py-3 rounded-t-lg border-b border-gray-200"
        style={{ backgroundColor: "#fefce8" }}
      >
        <h3 className="font-medium" style={{ color: "#ca8a04" }}>
          {typedData.label || "条件分支"}
        </h3>
      </div>

      {/* 分支列表 - 水平排列，和下方Handle对应 */}
      <div className="p-3">
        <div className="flex justify-between items-end gap-2">
          {allBranches.map((branch) => (
            <div
              key={`label-${branch.id}`}
              className="flex-1 flex flex-col items-center gap-1"
            >
              {/* 数字标记 */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${branch.isDefault ? "bg-gray-400" : "bg-amber-600"}`}
              >
                {branch.number}
              </div>
              {/* 标签 */}
              <div className="text-[10px] text-center max-w-full truncate">
                <span
                  className={
                    branch.isDefault ? "text-gray-500" : "text-gray-700"
                  }
                >
                  {branch.label ||
                    (branch.isDefault ? "默认" : `分支${branch.number}`)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 渲染所有分支Handle - 使用稳定的key和id */}
      {allBranches.map((branch, index: number) => {
        const position = ((index + 1) / (allBranches.length + 1)) * 100;

        return (
          <Handle
            key={`source-handle-${branch.id}`}
            type="source"
            position={Position.Bottom}
            id={branch.id}
            className="w-4 h-4 border-2 border-white"
            style={{ backgroundColor: "#ca8a04", left: `${position}%` }}
          />
        );
      })}
    </div>
  );
};

export default ConditionNode;
