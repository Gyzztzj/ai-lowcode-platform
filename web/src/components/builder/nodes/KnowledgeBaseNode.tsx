/**
 * 知识库检索节点
 */
import BaseNode from "./BaseNode";
import type { NodeProps } from "reactflow";
import { useAppStore } from "@/store/appStore";

interface KnowledgeBaseNodeData {
  knowledgeBase?: string;
  knowledgeBaseId?: string;
  label?: string;
}

const KnowledgeBaseNode = ({ data }: NodeProps<KnowledgeBaseNodeData>) => {
  const knowledgeBases = useAppStore((state) => state.knowledgeBases);
  const kbId = data.knowledgeBaseId || data.knowledgeBase;
  const kb = knowledgeBases.find((k: any) => k.id === kbId);

  return (
    <BaseNode
      title={data.label || "知识库检索"}
      headerStyle={{ backgroundColor: "#ecfeff" }}
      titleStyle={{ color: "#0891b2" }}
      description={<p>知识库: {kb?.name || (kbId ? "已选择" : "未选择")}</p>}
    />
  );
};

export default KnowledgeBaseNode;
