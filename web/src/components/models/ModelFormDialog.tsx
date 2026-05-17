import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogContentScrollable,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import type { Model } from "@/types";
import type { CreateModelRequest, UpdateModelRequest } from "@/types/api.types";

interface ModelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: Model | null;
  onSuccess?: () => void;
}

const ModelFormDialog = ({
  open,
  onOpenChange,
  model,
  onSuccess,
}: ModelFormDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    modelId: string;
    provider: string;
    type: "CHAT" | "VISION" | "MULTIMODAL" | "AUDIO" | "EMBEDDING";
    apiKey: string;
    apiEndpoint: string;
    description: string;
    enabled: boolean;
  }>({
    name: "",
    modelId: "",
    provider: "",
    type: "CHAT",
    apiKey: "",
    apiEndpoint: "",
    description: "",
    enabled: true,
  });

  const updateFormData = useCallback((modelData: Model | null) => {
    if (modelData) {
      setFormData({
        name: modelData.name,
        modelId: modelData.modelId || "",
        provider: modelData.provider,
        type: modelData.type,
        apiKey: "",
        apiEndpoint: modelData.apiEndpoint,
        description: modelData.description || "",
        enabled: modelData.enabled,
      });
    } else {
      setFormData({
        name: "",
        modelId: "",
        provider: "",
        type: "CHAT",
        apiKey: "",
        apiEndpoint: "",
        description: "",
        enabled: true,
      });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateFormData(model);
  }, [model, updateFormData]);

  const isSystemModel = model?.isSystem;

  // 清理输入值，移除多余的引号、反引号等
  const cleanInput = useCallback((value: string): string => {
    return value
      .trim()
      .replace(/^['"`]+|['"`]+$/g, "")
      .trim();
  }, []);

  const handleSubmit = useCallback(async () => {
    const cleanName = cleanInput(formData.name);
    const cleanModelId = cleanInput(formData.modelId);
    const cleanProvider = cleanInput(formData.provider);
    const cleanApiKey = cleanInput(formData.apiKey);
    const cleanApiEndpoint = cleanInput(formData.apiEndpoint);

    if (
      !cleanName ||
      !cleanModelId ||
      !cleanProvider ||
      !cleanApiKey ||
      !cleanApiEndpoint
    ) {
      toast.error("请填写所有必填字段");
      return;
    }

    setIsLoading(true);
    try {
      if (model) {
        const updateData: UpdateModelRequest = {
          name: cleanName,
          modelId: cleanModelId,
          provider: cleanProvider,
          type: formData.type,
          apiEndpoint: cleanApiEndpoint,
          description: cleanInput(formData.description) || undefined,
          enabled: formData.enabled,
        };
        if (cleanApiKey) {
          updateData.apiKey = cleanApiKey;
        }
        const { modelManagementApi } = await import("@/lib/api-client");
        await modelManagementApi.update(model.id, updateData);
        toast.success("更新成功", { description: "模型已成功更新" });
      } else {
        const createData: CreateModelRequest = {
          name: cleanName,
          modelId: cleanModelId,
          provider: cleanProvider,
          type: formData.type,
          apiKey: cleanApiKey,
          apiEndpoint: cleanApiEndpoint,
          description: cleanInput(formData.description) || undefined,
          enabled: formData.enabled,
        };
        const { modelManagementApi } = await import("@/lib/api-client");
        await modelManagementApi.create(createData);
        toast.success("创建成功", { description: "模型已成功创建" });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("操作失败:", error);
      toast.error(model ? "更新失败" : "创建失败", {
        description: model ? "无法更新模型" : "无法创建模型",
      });
    } finally {
      setIsLoading(false);
    }
  }, [model, formData, onOpenChange, onSuccess, cleanInput]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{model ? "编辑模型" : "创建模型"}</DialogTitle>
          <DialogDescription>
            {model
              ? isSystemModel
                ? "系统模型配置信息"
                : "编辑模型的配置信息"
              : "配置一个新的 AI 模型"}
          </DialogDescription>
        </DialogHeader>

        <DialogContentScrollable>
          {isSystemModel && (
            <Alert variant="warning" className="mb-2 mt-4">
              这是系统模型，您只能修改启用状态，其他配置无法修改。
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modelName">模型名称 *</Label>
                <Input
                  id="modelName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: GPT-4"
                  className="mt-1"
                  disabled={isSystemModel}
                />
              </div>
              <div>
                <Label htmlFor="provider">提供商 *</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  placeholder="例如: OpenAI"
                  className="mt-1"
                  disabled={isSystemModel}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="modelId">模型 ID *</Label>
              <Input
                id="modelId"
                value={formData.modelId}
                onChange={(e) =>
                  setFormData({ ...formData, modelId: e.target.value })
                }
                placeholder="例如: gpt-4, qwen-max, doubao-seed-2-0-pro"
                className="mt-1"
                disabled={isSystemModel}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modelType">模型类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(
                    value:
                      | "CHAT"
                      | "VISION"
                      | "MULTIMODAL"
                      | "AUDIO"
                      | "EMBEDDING",
                  ) => setFormData({ ...formData, type: value })}
                  disabled={isSystemModel}
                >
                  <SelectTrigger id="modelType" className="mt-1">
                    <SelectValue placeholder="选择模型类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAT">大语言模型</SelectItem>
                    <SelectItem value="VISION">视觉模型</SelectItem>
                    <SelectItem value="MULTIMODAL">全模态模型</SelectItem>
                    <SelectItem value="AUDIO">语音模型</SelectItem>
                    <SelectItem value="EMBEDDING">向量模型</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="apiKey">API 密钥 *</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder={model ? "留空表示不修改密钥" : "请输入 API 密钥"}
                className="mt-1"
                disabled={isSystemModel}
              />
            </div>

            <div>
              <Label htmlFor="apiEndpoint">API 端点 *</Label>
              <Input
                id="apiEndpoint"
                value={formData.apiEndpoint}
                onChange={(e) =>
                  setFormData({ ...formData, apiEndpoint: e.target.value })
                }
                placeholder="例如: https://api.openai.com/v1"
                className="mt-1"
                disabled={isSystemModel}
              />
            </div>

            <div>
              <Label htmlFor="description">描述 (可选)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="添加关于此模型的描述"
                className="mt-1"
                rows={3}
                disabled={isSystemModel}
              />
            </div>
          </div>
        </DialogContentScrollable>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "处理中..." : model ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelFormDialog;
