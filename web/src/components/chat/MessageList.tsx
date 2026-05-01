import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageSkeleton } from "./MessageSkeleton";

const MessageList = () => {
  const {
    messages,
    activeConversations,
    currentApp,
    currentConversation,
    deleteMessage,
    isLoadingMessages,
  } = useAppStore();

  // 获取当前会话的发送状态
  const isSending =
    activeConversations.get(currentConversation?.id || "")?.isSending || false;

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("确定要删除这条消息吗？")) {
      await deleteMessage(messageId);
    }
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 没有应用时，提示用户选择应用
  if (!currentApp) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">请先选择一个应用</h3>
        <p className="text-sm">在左侧下拉框中选择一个AI应用开始对话</p>
      </div>
    );
  }

  // 没有对话时，提示用户创建对话
  if (!currentConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">{currentApp.name}</h3>
        <p className="text-sm mb-4">
          {currentApp.description || "开始你的第一个对话"}
        </p>
        <p className="text-xs text-gray-400">
          点击左侧"新对话"按钮创建一个新的对话
        </p>
      </div>
    );
  }

  // 正在加载消息时显示骨架屏
  if (isLoadingMessages) {
    return <MessageSkeleton count={4} />;
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 scrollbar-thin">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">{currentApp.name}</h3>
          <p className="text-sm mb-4">
            {currentApp.description || "有什么可以帮助你的？"}
          </p>
          <p className="text-xs text-gray-400">在下方输入框发送消息开始对话</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 items-start ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {message.role === "user" ? "U" : "AI"}
              </AvatarFallback>
            </Avatar>
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 hover:opacity-100 transition-opacity"
              onClick={() => handleDeleteMessage(message.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}

      {isSending && (
        <div className="flex gap-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI正在思考...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
