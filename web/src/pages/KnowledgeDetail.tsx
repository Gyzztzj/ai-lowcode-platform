import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const KnowledgeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentKnowledgeBase,
    fetchKnowledgeBaseById,
    uploadDocument,
    deleteDocument,
  } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查是否有文档正在处理中
  const hasProcessingDocuments = currentKnowledgeBase?.documents?.some(
    (doc) => doc.status === "PROCESSING",
  );

  useEffect(() => {
    if (id) {
      fetchKnowledgeBaseById(id);
    }
  }, [id, fetchKnowledgeBaseById]);

  // 添加轮询机制，当有文档处理中时，定期刷新
  useEffect(() => {
    if (!hasProcessingDocuments || !id) return;

    const intervalId = setInterval(() => {
      fetchKnowledgeBaseById(id);
    }, 2000); // 每2秒刷新一次

    return () => clearInterval(intervalId);
  }, [hasProcessingDocuments, id, fetchKnowledgeBaseById]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // 检查文件类型 - 基于扩展名检查（更可靠）
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [".pdf", ".txt", ".docx", ".doc", ".md"];
    const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      toast.error("文件类型不支持", {
        description: "仅支持PDF、TXT、DOCX、DOC、MD格式",
      });
      return;
    }

    // 检查文件大小（最大100MB）
    if (file.size > 100 * 1024 * 1024) {
      toast.error("文件过大", {
        description: "文件大小不能超过100MB",
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(id, file);
      toast.success("上传成功", {
        description: "文档正在处理中，请稍候",
      });
      // 刷新知识库信息
      fetchKnowledgeBaseById(id);
    } catch (error) {
      toast.error("上传失败", {
        description: "请稍后重试",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  if (!currentKnowledgeBase) {
    return (
      <div className="p-6">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/knowledge")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{currentKnowledgeBase.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>文档列表</CardTitle>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.docx,.doc,.md"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "上传中..." : "上传文档"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!currentKnowledgeBase.documents ||
              currentKnowledgeBase.documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无文档，点击上方按钮上传
                </div>
              ) : (
                <div className="space-y-2">
                  {currentKnowledgeBase.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {(doc.fileSize / 1024).toFixed(2)} KB ·{" "}
                            {doc.chunkCount || 0} 个块
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            doc.status === "SUCCESS"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "PROCESSING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {doc.status === "SUCCESS"
                            ? "处理完成"
                            : doc.status === "PROCESSING"
                              ? "处理中"
                              : "处理失败"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (confirm("确定要删除这个文档吗？")) {
                              deleteDocument(doc.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>知识库信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">描述</p>
                <p>{currentKnowledgeBase.description || "暂无描述"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p>
                  {new Date(currentKnowledgeBase.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">文档总数</p>
                <p>{currentKnowledgeBase.documents?.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeDetail;
