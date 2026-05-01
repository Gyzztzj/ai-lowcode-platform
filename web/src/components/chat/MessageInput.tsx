import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

const MessageInput = () => {
  const [content, setContent] = useState("");
  const { sendMessageStream, activeConversations, currentConversation, currentApp } = useAppStore();
  
  // 获取当前会话的发送状态
  const isSending = activeConversations.get(currentConversation?.id || '')?.isSending || false;

  const getPlaceholder = () => {
    if (!currentApp) {
      return "请先选择一个应用";
    }
    if (!currentConversation) {
      return "请先创建一个对话";
    }
    if (isSending) {
      return "AI正在回复中...";
    }
    return "输入消息...";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSending || !currentConversation || !currentApp) {
      return;
    }

    const messageContent = content.trim();
    setContent("");

    await sendMessageStream(messageContent);
  };

  // 按Enter发送，Shift+Enter换行
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-gray-200 bg-white"
    >
      <div className="flex gap-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="resize-none min-h-[60px] max-h-[200px]"
          disabled={isSending || !currentConversation || !currentApp}
        />
        <Button
          type="submit"
          disabled={
            isSending || !content.trim() || !currentConversation || !currentApp
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
