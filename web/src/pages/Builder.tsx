import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { useAppStore } from "@/store/appStore";
import BuilderCanvas from "@/components/builder/BuilderCanvas";
import NodePanel from "@/components/builder/panels/NodePanel";
import ApiKeysManager from "@/components/api-keys/ApiKeysManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Play, Share2, Workflow, Key } from "lucide-react";
import { toast } from "sonner";
import PreviewDialog from "@/components/builder/PreviewDialog";
import api from "@/lib/axios";
import type { App } from "@/types";

const Builder = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const currentApp = useAppStore(state => state.currentApp);
  const fetchAppById = useAppStore(state => state.fetchAppById);
  const saveAppFlow = useAppStore(state => state.saveAppFlow);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  useEffect(() => {
    if (appId) {
      fetchAppById(appId);
    }
  }, [appId, fetchAppById]);

  const handleSave = async () => {
    if (!appId) return;
    setIsSaving(true);
    try {
      await saveAppFlow(appId);
      toast.success("保存成功", { description: "应用流程已保存" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentApp) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  const handlePublish = async () => {
    if (!appId) return;
    try {
      const response = (await api.post(`/apps/${appId}/publish`)) as App;
      const shareUrl = `${window.location.origin}/share/${response.shareId}`;

      await navigator.clipboard.writeText(shareUrl);

      toast.success("发布成功", {
        description: "分享链接已复制到剪贴板",
      });
    } catch (error) {
      console.error("发布失败:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/apps")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{currentApp.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "builder" && (
            <>
              <Button variant="ghost" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
              <Button variant="ghost" onClick={() => setIsPreviewOpen(true)}>
                <Play className="h-4 w-4 mr-2" />
                预览
              </Button>
              <Button onClick={handlePublish}>
                <Share2 className="h-4 w-4 mr-2" />
                发布
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white">
        <div className="px-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="h-12 bg-transparent border-b-0">
              <TabsTrigger
                value="builder"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-4"
              >
                <Workflow className="h-4 w-4 mr-2" />
                流程编辑器
              </TabsTrigger>
              <TabsTrigger
                value="api-keys"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-4"
              >
                <Key className="h-4 w-4 mr-2" />
                API 密钥
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "builder" ? (
          <ReactFlowProvider>
            <div className="h-full flex">
              <NodePanel />
              <BuilderCanvas />
            </div>
          </ReactFlowProvider>
        ) : (
          <div className="p-6 overflow-auto h-full">
            <ApiKeysManager appId={appId} app={currentApp} />
          </div>
        )}
      </div>

      {activeTab === "builder" && (
        <PreviewDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
      )}
    </div>
  );
};

export default Builder;
