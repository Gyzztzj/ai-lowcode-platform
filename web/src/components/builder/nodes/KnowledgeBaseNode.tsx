/**
 * 知识库检索节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";
import { useAppStore } from "@/store/appStore";

const KnowledgeBaseNode = ({ data }: NodeProps) => {
  const nodeData = data as any;
  const knowledgeBases = useAppStore((state) => state.knowledgeBases);
  const kbId = nodeData.knowledgeBaseId || nodeData.knowledgeBase;
  const kb = knowledgeBases.find((k: any) => k.id === kbId);

  return (
    <BaseNode
      title={nodeData.label || "知识库检索"}
      headerStyle={{ backgroundColor: "#ecfeff" }}
      titleStyle={{ color: "#0891b2" }}
      description={<p>知识库: {kb?.name || (kbId ? "已选择" : "未选择")}</p>}
    />
  );
};

export default KnowledgeBaseNode;
