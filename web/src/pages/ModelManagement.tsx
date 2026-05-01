import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Brain,
  Eye,
  Image as ImageIcon,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import ModelFormDialog from "@/components/models/ModelFormDialog";
import { modelManagementApi } from "@/lib/api-client";
import type { Model } from "@/types";

const ModelManagement = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<string | null>(
    null,
  );
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const data = await modelManagementApi.getAll();
      setModels(data);
    } catch (error) {
      console.error("获取模型列表失败:", error);
      toast.error("加载失败", { description: "无法加载模型列表，请稍后重试" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleEditModel = (model: Model) => {
    setSelectedModel(model);
    setIsEditDialogOpen(true);
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      await modelManagementApi.delete(modelId);
      setModels(models.filter((m) => m.id !== modelId));
      toast.success("删除成功", { description: "模型已删除" });
      setIsDeleteDialogOpen(null);
    } catch (error) {
      console.error("删除模型失败:", error);
      toast.error("删除失败", {
        description: "无法删除模型，请检查是否有应用在使用该模型",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CHAT":
        return <Bot className="h-5 w-5" />;
      case "VISION":
        return <Eye className="h-5 w-5" />;
      case "MULTIMODAL":
        return <ImageIcon className="h-5 w-5" />;
      case "AUDIO":
        return <Mic className="h-5 w-5" />;
      case "EMBEDDING":
        return <Brain className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "CHAT":
        return "大语言模型";
      case "VISION":
        return "视觉模型";
      case "MULTIMODAL":
        return "全模态模型";
      case "AUDIO":
        return "语音模型";
      case "EMBEDDING":
        return "向量模型";
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">模型管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理您的 AI 模型配置</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加模型
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无模型</h3>
            <p className="text-gray-500 mb-4">添加您的第一个 AI 模型开始使用</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加模型
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <Card key={model.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${model.enabled ? "bg-green-50" : "bg-gray-100"}`}
                    >
                      {getTypeIcon(model.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {model.name}
                        {model.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        {model.isSystem && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            系统模型
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {model.provider} · {getTypeText(model.type)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditModel(model)}
                      disabled={model.isSystem}
                      title={model.isSystem ? "系统模型不可编辑" : "编辑模型"}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(model.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={model.isSystem}
                      title={model.isSystem ? "系统模型不可删除" : "删除模型"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {model.description && (
                    <p className="text-gray-600">{model.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    <p>API 端点: {model.apiEndpoint}</p>
                    <p className="mt-1">模型 ID: {model.modelId}</p>
                    <p className="mt-1">
                      更新时间: {formatDate(model.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        model.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {model.enabled ? "已启用" : "已禁用"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ModelFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        model={null}
        onSuccess={fetchModels}
      />

      <ModelFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        model={selectedModel}
        onSuccess={fetchModels}
      />

      <Dialog
        open={!!isDeleteDialogOpen}
        onOpenChange={(open) => !open && setIsDeleteDialogOpen(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个模型吗？删除后将无法恢复，任何使用此模型的应用可能会受到影响。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                isDeleteDialogOpen && handleDeleteModel(isDeleteDialogOpen)
              }
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelManagement;
