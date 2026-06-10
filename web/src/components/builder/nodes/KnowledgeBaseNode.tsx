/**
 * 知识库检索节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "@xyflow/react";
import { useKnowledgeStore } from "@/store/knowledgeStore";
import type { KnowledgeBase } from "@/types";

const KnowledgeBaseNode = ({ data }: NodeProps) => {
  const typedData = data as {
    label?: string;
    knowledgeBaseId?: string;
    knowledgeBase?: string;
    query?: string;
  };
  const knowledgeBases = useKnowledgeStore((state) => state.knowledgeBases);
  const kbId = typedData.knowledgeBaseId || typedData.knowledgeBase;
  const kb = knowledgeBases.find((k: KnowledgeBase) => k.id === kbId);

  return (
    <BaseNode
      title={typedData.label || "知识库检索"}
      headerStyle={{ backgroundColor: "#ecfeff" }}
      titleStyle={{ color: "#0891b2" }}
      description={<p>知识库: {kb?.name || (kbId ? "已选择" : "未选择")}</p>}
    />
  );
};

export default KnowledgeBaseNode;
