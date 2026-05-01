import { useAppStore } from "@/store/appStore";
import { useBuilderStore } from "@/store/builderStore";
import { v4 as uuidv4 } from "uuid";

// 颜色映射
const colorMap: Record<string, { bg: string; text: string }> = {
  purple: { bg: "#faf5ff", text: "#7c3aed" },
  blue: { bg: "#eff6ff", text: "#2563eb" },
  orange: { bg: "#fff7ed", text: "#ea580c" },
  cyan: { bg: "#ecfeff", text: "#0891b2" },
  yellow: { bg: "#fefce8", text: "#ca8a04" },
  green: { bg: "#f0fdf4", text: "#16a34a" },
  red: { bg: "#fef2f2", text: "#dc2626" },
};

const NodePanel = () => {
  const addNode = useBuilderStore((state) => state.addNode);
  const currentApp = useAppStore((state) => state.currentApp);

  // 根据应用配置判断是否显示知识库节点
  const showKnowledgeBaseNode =
    currentApp &&
    currentApp.embeddingModel &&
    currentApp.embeddingModel !== "none";

  const nodeTemplates = [
    { type: "systemPrompt", label: "系统提示词", color: "purple" },
    { type: "userInput", label: "用户输入", color: "blue" },
    { type: "llm", label: "大模型", color: "orange" },
    ...(showKnowledgeBaseNode
      ? [{ type: "knowledgeBase", label: "知识库检索", color: "cyan" }]
      : []),
    { type: "condition", label: "条件分支", color: "yellow" },
    { type: "variableSet", label: "变量设置", color: "green" },
  ];

  const handleDragStart = (
    e: React.DragEvent,
    type: string,
    label: string,
    color: string,
  ) => {
    e.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type, label, color }),
    );
  };

  const handleAddNode = (type: string, label: string, color: string) => {
    const nodeData: Record<string, unknown> = { label, color };
    
    // 为变量设置节点添加初始的空变量数组
    if (type === 'variableSet') {
      nodeData.variables = [];
    }
    
    // 为 LLM 节点初始化默认值
    if (type === 'llm') {
      if (currentApp?.defaultModel) {
        nodeData.model = currentApp.defaultModel;
      }
      nodeData.temperature = 0.7;
    }
    
    addNode({
      id: uuidv4(),
      type: type,
      position: { x: 100, y: 100 },
      data: nodeData,
    });
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">节点列表</h3>
      <div className="space-y-2">
        {nodeTemplates.map(({ type, label, color }) => {
          const colors = colorMap[color] || { bg: "#f3f4f6", text: "#374151" };
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type, label, color)}
              onClick={() => handleAddNode(type, label, color)}
              className="px-3 py-2 rounded-md text-sm font-medium cursor-move transition-colors"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NodePanel;
