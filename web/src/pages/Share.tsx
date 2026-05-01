import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
import type { App } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: string;
  content: string;
  isThinking?: boolean;
  thinkingStartTime?: number;
}

const Share = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [app, setApp] = useState<App | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (shareId) {
      api
        .get(`/apps/share/${shareId}`)
        .then((res) => setApp(res as unknown as App));
    }
  }, [shareId]);

  // 清理思考计时
  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    };
  }, []);

  const formatThinkingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs > 0 ? secs + "秒" : ""}`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !app) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setThinkingSeconds(0);

    const tempMessage: Message = {
      role: "assistant",
      content: "",
      isThinking: true,
      thinkingStartTime: Date.now(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    // 开始计时
    thinkingIntervalRef.current = setInterval(() => {
      setThinkingSeconds((prev) => prev + 1);
    }, 1000);

    let fullContent = "";
    let hasReceivedContent = false;

    try {
      const response = await fetch(
        `/api/apps/share/${app.shareId}/chat-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userInput: userMessage.content }),
        },
      );

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          let doneReceived = false;

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith("data: ")) {
              const data = trimmedLine.slice(6).trim();

              if (data === "[DONE]") {
                doneReceived = true;
                break;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.content) {
                  if (!hasReceivedContent) {
                    hasReceivedContent = true;
                    // 停止思考计时
                    if (thinkingIntervalRef.current) {
                      clearInterval(thinkingIntervalRef.current);
                    }
                  }
                  fullContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((msg, index) =>
                      index === prev.length - 1 && msg.role === "assistant"
                        ? { ...msg, content: fullContent, isThinking: false }
                        : msg,
                    ),
                  );
                }
              } catch (e) {
                console.error("解析流式响应失败:", e);
              }
            }
          }

          if (doneReceived) {
            break;
          }
        }
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      const errorMsg = (error as Error)?.message?.includes("超时") 
        ? "请求超时，请稍后重试或简化您的问题。"
        : "抱歉，发生了错误，请稍后重试。";
      
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1 && msg.role === "assistant"
            ? {
                ...msg,
                content: errorMsg,
                isThinking: false,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    }
  };

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>应用不存在或未发布</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6">
        <h1 className="text-lg font-semibold">{app.name}</h1>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-6">
        <div className="flex-1 overflow-auto p-4 space-y-4 border rounded-lg bg-white mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">{app.name}</h3>
              <p>{app.description || "开始对话吧"}</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    {message.role === "user" ? "U" : "AI"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white ml-auto"
                      : "bg-gray-100"
                  }`}
                >
                  {message.role === "assistant" &&
                  message.isThinking &&
                  !message.content ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">思考中...</span>
                        <span className="text-xs text-gray-400 mt-1">
                          已等待 {formatThinkingTime(thinkingSeconds)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <span>发送</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Share;
