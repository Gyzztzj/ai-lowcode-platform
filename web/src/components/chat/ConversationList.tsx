import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

const ConversationList = () => {
  const conversations = useAppStore(state => state.conversations);
  const currentConversation = useAppStore(state => state.currentConversation);
  const createConversation = useAppStore(state => state.createConversation);
  const deleteConversation = useAppStore(state => state.deleteConversation);
  const updateConversation = useAppStore(state => state.updateConversation);
  const setCurrentConversation = useAppStore(state => state.setCurrentConversation);
  const currentApp = useAppStore(state => state.currentApp);
  const apps = useAppStore(state => state.apps);
  const setCurrentApp = useAppStore(state => state.setCurrentApp);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // 当应用加载完成后，如果没有选择应用，自动选择第一个
  useEffect(() => {
    if (!currentApp && apps.length > 0) {
      setCurrentApp(apps[0]);
    }
  }, [apps, currentApp, setCurrentApp]);

  // 获取当前应用的对话并缓存
  const currentAppConversations = useMemo(() => {
    if (!currentApp) return [];
    return conversations.filter(
      (c) => c.appId === currentApp?.id || (c.app && c.app.id === currentApp?.id),
    );
  }, [conversations, currentApp]);

  const handleNewConversation = async () => {
    if (!currentApp) {
      alert("请先选择一个应用");
      return;
    }

    const conversation = await createConversation(currentApp.id);
    setCurrentConversation(conversation);
  };

  const startEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editingId) {
      setEditingId(null);
      return;
    }
    await updateConversation(editingId, { title: editTitle });
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <Select
          value={currentApp?.id || ""}
          onValueChange={(value) => {
            const app = apps.find((a) => a.id === value);
            if (app) {
              setCurrentApp(app);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择一个应用" />
          </SelectTrigger>
          <SelectContent>
            {apps.map((app) => (
              <SelectItem key={app.id} value={app.id}>
                {app.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="w-full" onClick={handleNewConversation}>
          <Plus className="h-4 w-4 mr-2" />
          新对话
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1 scrollbar-thin">
        {currentAppConversations.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            暂无对话，点击上方按钮创建
          </div>
        ) : (
          currentAppConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                currentConversation?.id === conversation.id
                  ? "bg-blue-50 text-blue-600"
                  : "hover:bg-gray-100",
              )}
            >
              {editingId === conversation.id ? (
                <Input
                  className="flex-1 h-7 text-sm"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={saveEdit}
                  autoFocus
                />
              ) : (
                <span
                  className="truncate flex-1 cursor-pointer"
                  onClick={() => {
                    setCurrentConversation(conversation);
                  }}
                >
                  {conversation.title}
                </span>
              )}

              {editingId !== conversation.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(conversation)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm("确定要删除这个对话吗？")) {
                          deleteConversation(conversation.id);
                        }
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除对话
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
