import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentScrollable,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBuilderStore } from "@/store/builderStore";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { appsApi } from "@/lib/api-client";
import { toast } from "sonner";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PreviewDialog = ({ open, onOpenChange }: PreviewDialogProps) => {
  const { nodes, edges } = useBuilderStore();
  const { currentApp } = useAppStore();
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; id?: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      id: Date.now().toString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 过滤掉 reactflow 可能添加的额外字段，只保留必要的字段
      const cleanedNodes = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      }));

      const cleanedEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      }));

      const response = await appsApi.previewFlow({
        appId: currentApp?.id,
        nodes: cleanedNodes,
        edges: cleanedEdges,
        userInput: userMessage.content,
      });

      // 提取实际内容
      let rawContent = "";
      if (response && typeof response === "object" && "result" in response) {
        rawContent = String(response.result || "");
      } else if (response) {
        rawContent = String(response);
      }

      // 添加临时消息用于流式显示
      const tempMessageId = Date.now().toString();
      const tempMessage = { role: "assistant", id: tempMessageId, content: "" };
      setMessages((prev) => [...prev, tempMessage]);
      setIsLoading(false);

      // 模拟流式输出效果
      if (rawContent) {
        const calculateDelay = (char: string) => {
          const baseDelay = 30;
          const punctuationDelay = 100;
          const sentenceEndDelay = 200;
          const punctuationRegex = /[，。！？；：、,.!?]/;
          const sentenceEndRegex = /[。！？.!?]/;

          if (sentenceEndRegex.test(char)) {
            return baseDelay + sentenceEndDelay;
          } else if (punctuationRegex.test(char)) {
            return baseDelay + punctuationDelay;
          } else {
            return baseDelay;
          }
        };

        let currentContent = "";
        for (const char of rawContent) {
          currentContent += char;

          await new Promise((resolve) =>
            setTimeout(resolve, calculateDelay(char)),
          );

          setMessages((prev) =>
            prev.map((msg) =>
              (msg as any).id === tempMessageId
                ? { ...msg, content: currentContent }
                : msg,
            ),
          );
        }
      } else {
        // 如果没有内容，直接更新
        setMessages((prev) =>
          prev.map((msg) =>
            (msg as any).id === tempMessageId
              ? { ...msg, content: rawContent }
              : msg,
          ),
        );
      }
    } catch (error: any) {
      console.error("预览失败:", error);
      toast.error("预览失败", {
        description:
          error?.response?.data?.message || error?.message || "请稍后重试",
      });
      // 移除刚才添加的用户消息
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // 对话框关闭时清空消息
  useEffect(() => {
    if (!open) {
      setMessages([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>应用预览 - {currentApp?.name}</DialogTitle>
        </DialogHeader>

        <DialogContentScrollable className="px-0">
          <div className="p-4 space-y-4 border rounded-lg bg-gray-50 min-h-[300px]">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                发送消息开始预览
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.role === "user" ? "U" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="animate-pulse">正在思考...</div>
                </div>
              </div>
            )}
          </div>
        </DialogContentScrollable>

        <div className="flex flex-col gap-2 pt-4 border-t">
          <div className="flex items-end gap-2 p-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              className="min-h-[44px] max-h-[120px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="h-[44px] shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
