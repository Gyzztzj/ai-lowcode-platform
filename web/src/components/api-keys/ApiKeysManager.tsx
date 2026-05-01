import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiKeysApi,
  type ApiKey,
  type CreateApiKeyRequest,
} from "@/lib/api-client";
import type { App } from "@/types";

interface ApiKeysManagerProps {
  appId?: string;
  app?: App;
}

const ApiKeysManager = ({ appId, app }: ApiKeysManagerProps) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<string | null>(
    null,
  );
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState<{
    name: string;
    description: string;
    expiresAt: string;
    appId?: string;
  }>({
    name: "",
    description: "",
    expiresAt: "",
    appId,
  });

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const keys = appId
        ? await apiKeysApi.getByAppId(appId)
        : await apiKeysApi.getAll();
      setApiKeys(keys);
    } catch (error) {
      console.error("获取 API 密钥失败:", error);
      toast.error("获取失败", { description: "无法加载 API 密钥列表" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [appId]);

  const handleCreateKey = async () => {
    if (!newKeyData.name.trim()) {
      toast.error("请输入密钥名称");
      return;
    }

    try {
      const request: CreateApiKeyRequest = {
        name: newKeyData.name.trim(),
        description: newKeyData.description.trim() || undefined,
        appId: newKeyData.appId,
        permissions: ["*"],
      };
      if (newKeyData.expiresAt) {
        request.expiresAt = newKeyData.expiresAt;
      }

      const response = await apiKeysApi.create(request);
      toast.success("创建成功", {
        description: "请妥善保管您的 API 密钥，它只会显示一次",
      });
      setShowKeyId(response.id);
      setApiKeys([
        ...apiKeys,
        {
          ...response,
          key: response.key,
          lastUsedAt: null,
          requestCount: 0,
        } as ApiKey,
      ]);
      setIsCreateDialogOpen(false);
      setNewKeyData({ name: "", description: "", expiresAt: "", appId });
    } catch (error) {
      console.error("创建 API 密钥失败:", error);
      toast.error("创建失败", { description: "无法创建 API 密钥" });
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await apiKeysApi.delete(keyId);
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
      toast.success("删除成功", { description: "API 密钥已删除" });
      setIsDeleteDialogOpen(null);
    } catch (error) {
      console.error("删除 API 密钥失败:", error);
      toast.error("删除失败", { description: "无法删除 API 密钥" });
    }
  };

  const handleCopyKey = (key: string, name: string) => {
    navigator.clipboard.writeText(key);
    toast.success("已复制", { description: `${name} 的密钥已复制到剪贴板` });
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const response = await apiKeysApi.revoke(keyId);
      setApiKeys(
        apiKeys.map((k) =>
          k.id === keyId ? { ...k, status: response.status } : k,
        ),
      );
      toast.success("已撤销", { description: "API 密钥已撤销" });
    } catch (error) {
      console.error("撤销 API 密钥失败:", error);
      toast.error("撤销失败", { description: "无法撤销 API 密钥" });
    }
  };

  const handleActivateKey = async (keyId: string) => {
    try {
      const response = await apiKeysApi.activate(keyId);
      setApiKeys(
        apiKeys.map((k) =>
          k.id === keyId ? { ...k, status: response.status } : k,
        ),
      );
      toast.success("已激活", { description: "API 密钥已激活" });
    } catch (error) {
      console.error("激活 API 密钥失败:", error);
      toast.error("激活失败", { description: "无法激活 API 密钥" });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("zh-CN");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "revoked":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "expired":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "已激活";
      case "revoked":
        return "已撤销";
      case "expired":
        return "已过期";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">API 密钥管理</h2>
          <p className="text-sm text-gray-500">
            {app ? `管理应用 "${app.name}" 的 API 密钥` : "管理所有 API 密钥"}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建 API 密钥
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无 API 密钥</h3>
            <p className="text-gray-500 mb-4">
              创建您的第一个 API 密钥开始使用 API
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建 API 密钥
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {apiKey.name}
                      {getStatusIcon(apiKey.status)}
                      <span className="text-sm font-normal text-gray-500">
                        {getStatusText(apiKey.status)}
                      </span>
                    </CardTitle>
                    {apiKey.app && (
                      <CardDescription>
                        关联应用: {apiKey.app.name}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {apiKey.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(apiKey.id)}
                      >
                        撤销
                      </Button>
                    )}
                    {apiKey.status === "revoked" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActivateKey(apiKey.id)}
                      >
                        激活
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(apiKey.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-500">API 密钥</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-md px-3 py-2 font-mono text-sm">
                        {showKeyId === apiKey.id && apiKey.key
                          ? apiKey.key
                          : "sk-...-" + apiKey.id.slice(-8)}
                      </div>
                      {apiKey.key && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowKeyId(
                              showKeyId === apiKey.id ? null : apiKey.id,
                            )
                          }
                        >
                          {showKeyId === apiKey.id ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {apiKey.key && showKeyId === apiKey.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyKey(apiKey.key!, apiKey.name)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">创建时间</span>
                      <p className="font-medium">
                        {formatDate(apiKey.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">最后使用</span>
                      <p className="font-medium">
                        {formatDate(apiKey.lastUsedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">请求次数</span>
                      <p className="font-medium">{apiKey.requestCount}</p>
                    </div>
                  </div>

                  {apiKey.expiresAt && (
                    <div className="text-sm">
                      <span className="text-gray-500">过期时间</span>
                      <p className="font-medium">
                        {formatDate(apiKey.expiresAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 创建 API 密钥对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>创建 API 密钥</DialogTitle>
            <DialogDescription>
              创建一个新的 API 密钥用于访问您的应用
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="keyName">密钥名称</Label>
              <Input
                id="keyName"
                value={newKeyData.name}
                onChange={(e) =>
                  setNewKeyData({ ...newKeyData, name: e.target.value })
                }
                placeholder="例如: 生产环境 API"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="keyDescription">描述 (可选)</Label>
              <Textarea
                id="keyDescription"
                value={newKeyData.description}
                onChange={(e) =>
                  setNewKeyData({ ...newKeyData, description: e.target.value })
                }
                placeholder="用于说明此密钥的用途"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="expiresAt">过期时间 (可选)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={newKeyData.expiresAt}
                onChange={(e) =>
                  setNewKeyData({ ...newKeyData, expiresAt: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateKey}>创建密钥</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={!!isDeleteDialogOpen}
        onOpenChange={(open) => !open && setIsDeleteDialogOpen(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个 API
              密钥吗？删除后将无法恢复，任何使用此密钥的请求都将失败。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                isDeleteDialogOpen && handleDeleteKey(isDeleteDialogOpen)
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

export default ApiKeysManager;
