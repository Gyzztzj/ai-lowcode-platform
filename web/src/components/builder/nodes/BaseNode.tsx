/**
 * 基础节点
 */

import type { ReactNode } from "react";
import { Handle, Position } from "reactflow";

interface BaseNodeProps {
  title: string;
  titleClassName?: string;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  description?: ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean;
  className?: string;
}

const BaseNode = ({
  title,
  titleClassName = "",
  headerClassName = "",
  headerStyle,
  titleStyle,
  description,
  hasInput = true,
  hasOutput = true,
  className = "",
}: BaseNodeProps) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm min-w-[180px] ${className}`}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 border-2 border-white"
          style={{ backgroundColor: "#3b82f6" }}
        />
      )}
      <div
        className={`px-4 py-3 rounded-t-lg border-b border-gray-200 ${headerClassName}`}
        style={headerStyle}
      >
        <h3 className={`font-medium ${titleClassName}`} style={titleStyle}>
          {title}
        </h3>
      </div>
      {description && <div className="p-3 text-sm text-gray-600">{description}</div>}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 border-2 border-white"
          style={{ backgroundColor: "#3b82f6" }}
        />
      )}
    </div>
  );
};

export default BaseNode;
