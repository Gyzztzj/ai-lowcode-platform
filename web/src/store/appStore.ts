import { create } from "zustand";
import type { App, Conversation, Message, Model, KnowledgeBase } from "@/types";
import {
  appsApi,
  conversationsApi,
  modelManagementApi,
  knowledgeApi,
} from "@/lib/api-client";
import { useBuilderStore } from "./builderStore";

// 本地存储键名
const STORAGE_KEY = "ai-lowcode-conversations";

// 从本地存储加载会话
const loadConversations = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load conversations from localStorage:", e);
    return [];
  }
};

// 保存会话到本地存储
const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

interface AppState {
  // 数据
  apps: App[];
  currentApp: App | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  models: Model[];
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: KnowledgeBase | null;

  // 状态
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  activeConversations: Map<string, { isSending: boolean; messages: Message[] }>;

  // 初始化标志
  initialized: {
    apps: boolean;
    conversations: boolean;
    models: boolean;
    knowledgeBases: boolean;
  };

  // Actions
  fetchApps: (force?: boolean) => Promise<void>;
  createApp: (app: Partial<App>) => Promise<App>;
  updateApp: (id: string, app: Partial<App>) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
  setCurrentApp: (app: App | null) => void;

  fetchConversations: (force?: boolean) => Promise<void>;
  createConversation: (appId: string, title?: string) => Promise<Conversation>;
  updateConversation: (id: string, data: { title: string }) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;

  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendMessageStream: (content: string) => Promise<void>;

  fetchModels: (force?: boolean) => Promise<void>;

  fetchAppById: (id: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  saveAppFlow: (id: string) => Promise<void>;

  fetchKnowledgeBases: (force?: boolean) => Promise<void>;
  fetchKnowledgeBaseById: (id: string) => Promise<void>;
  createKnowledgeBase: (name: string, description?: string) => Promise<void>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  uploadDocument: (knowledgeBaseId: string, file: File) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 数据
  apps: [],
  currentApp: null,
  conversations: loadConversations(),
  currentConversation: null,
  messages: [],
  models: [],
  knowledgeBases: [],
  currentKnowledgeBase: null,

  // 状态
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  activeConversations: new Map(),

  // 初始化标志
  initialized: {
    apps: false,
    conversations: false,
    models: false,
    knowledgeBases: false,
  },

  // --- Apps ---
  fetchApps: async (force = false) => {
    const { initialized, isLoading } = get();
    if (!force && (initialized.apps || isLoading)) return;

    set({ isLoading: true });
    try {
      const result = (await appsApi.getAll()) as any;
      let apps = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];
      // 将 embeddingModel 的 null 转换为 'none'
      apps = apps.map((app: any) => ({
        ...app,
        embeddingModel:
          app.embeddingModel === null ? "none" : app.embeddingModel,
      }));
      set({
        apps,
        isLoading: false,
        initialized: { ...get().initialized, apps: true },
      });
    } catch (error) {
      console.error("Failed to fetch apps:", error);
      set({ isLoading: false });
    }
  },

  createApp: async (app) => {
    const createData: any = { name: app.name || "新应用" };
    if (app.description !== undefined) createData.description = app.description;
    if (app.systemPrompt !== undefined)
      createData.systemPrompt = app.systemPrompt;
    if (app.defaultModel !== undefined)
      createData.defaultModel = app.defaultModel;
    if (app.embeddingModel !== undefined)
      createData.embeddingModel = app.embeddingModel;
    if (app.isPublic !== undefined) createData.isPublic = app.isPublic;

    const newApp = await appsApi.create(createData);
    // 将返回的 embeddingModel 的 null 转换为 'none'
    const processedApp = {
      ...newApp,
      embeddingModel:
        newApp.embeddingModel === null ? "none" : newApp.embeddingModel,
    };
    set((state) => ({ apps: [processedApp, ...state.apps] }));
    return processedApp;
  },

  updateApp: async (id, app) => {
    const updateData: any = { ...app };
    const updatedApp = await appsApi.update(id, updateData);
    // 将返回的 embeddingModel 的 null 转换为 'none'
    const processedApp = {
      ...updatedApp,
      embeddingModel:
        updatedApp.embeddingModel === null ? "none" : updatedApp.embeddingModel,
    };
    set((state) => ({
      apps: state.apps.map((a) => (a.id === id ? processedApp : a)),
      currentApp: state.currentApp?.id === id ? processedApp : state.currentApp,
    }));
  },

  deleteApp: async (id) => {
    await appsApi.delete(id);
    set((state) => ({
      apps: state.apps.filter((a) => a.id !== id),
      currentApp: state.currentApp?.id === id ? null : state.currentApp,
    }));
  },

  setCurrentApp: (app) => {
    if (!app) {
      set({ currentApp: null, currentConversation: null, messages: [] });
      return;
    }
    set({ currentApp: app, currentConversation: null, messages: [] });
    // 自动加载该应用的会话并选择第一个
    get()
      .fetchConversations()
      .then(() => {
        const { conversations, setCurrentConversation } = get();
        if (conversations.length > 0) {
          const appConversations = conversations.filter(
            (c) => c.appId === app.id || (c.app && c.app.id === app.id),
          );
          if (appConversations.length > 0) {
            setCurrentConversation(appConversations[0]);
          }
        }
      });
  },

  // --- Conversations ---
  fetchConversations: async (force = false) => {
    const { initialized } = get();
    if (!force && initialized.conversations) return;

    try {
      const result = (await conversationsApi.getAll()) as any;
      let conversations = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];
      if (!Array.isArray(conversations)) {
        conversations = [];
      }
      saveConversations(conversations);
      set({
        conversations,
        initialized: { ...get().initialized, conversations: true },
      });
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
      set({
        conversations: loadConversations(),
        initialized: { ...get().initialized, conversations: true },
      });
    }
  },

  createConversation: async (appId, title?: string) => {
    const conversation = await conversationsApi.create({ appId, title });
    set((state) => {
      const updatedConversations = [conversation, ...state.conversations];
      saveConversations(updatedConversations);
      return { conversations: updatedConversations };
    });
    return conversation;
  },

  updateConversation: async (id, data) => {
    const updatedConversation = await conversationsApi.update(id, data);
    set((state) => {
      const updatedConversations = state.conversations.map((c) =>
        c.id === id ? updatedConversation : c,
      );
      saveConversations(updatedConversations);
      return {
        conversations: updatedConversations,
        currentConversation:
          state.currentConversation?.id === id
            ? updatedConversation
            : state.currentConversation,
      };
    });
  },

  deleteConversation: async (id) => {
    await conversationsApi.delete(id);
    set((state) => {
      const updatedConversations = state.conversations.filter(
        (c) => c.id !== id,
      );
      saveConversations(updatedConversations);
      return {
        conversations: updatedConversations,
        currentConversation:
          state.currentConversation?.id === id
            ? null
            : state.currentConversation,
        messages: state.currentConversation?.id === id ? [] : state.messages,
      };
    });
  },

  setCurrentConversation: (conversation) => {
    if (!conversation) {
      set({ currentConversation: null, messages: [] });
      return;
    }
    set({ currentConversation: conversation });
    get().fetchMessages(conversation.id);
  },

  // --- Messages ---
  fetchMessages: async (conversationId) => {
    set({ isLoadingMessages: true });
    try {
      const conversation = (await conversationsApi.getById(
        conversationId,
      )) as any;
      const messages = conversation.messages || [];
      set({ messages, isLoadingMessages: false });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      set({ messages: [], isLoadingMessages: false });
    }
  },

  sendMessage: async (content) => {
    const { currentConversation, messages } = get();
    if (!currentConversation) return;

    set((state) => {
      state.isSending = true;
      const activeConversations = new Map(state.activeConversations);
      activeConversations.set(currentConversation.id, {
        isSending: true,
        messages: messages,
      });
      return { isSending: true, activeConversations };
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      conversationId: currentConversation.id,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
    }));

    try {
      const response = await conversationsApi.sendMessage(
        currentConversation.id,
        { content },
      );

      set((state) => {
        const updatedMessages = [...state.messages, response.message];
        state.isSending = false;
        const activeConversations = new Map(state.activeConversations);
        activeConversations.set(currentConversation.id, {
          isSending: false,
          messages: updatedMessages,
        });
        return {
          messages: updatedMessages,
          isSending: false,
          activeConversations,
        };
      });
    } catch (error) {
      console.error("发送消息失败:", error);
      set((state) => {
        state.isSending = false;
        const activeConversations = new Map(state.activeConversations);
        activeConversations.set(currentConversation.id, {
          isSending: false,
          messages: messages,
        });
        return { isSending: false, activeConversations };
      });
    }
  },

  sendMessageStream: async (content) => {
    const { currentConversation, messages } = get();
    if (!currentConversation) return;

    const isFirstMessage = messages.length === 0;
    set((state) => {
      state.isSending = true;
      const activeConversations = new Map(state.activeConversations);
      activeConversations.set(currentConversation.id, {
        isSending: true,
        messages: messages,
      });
      return { isSending: true, activeConversations };
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      conversationId: currentConversation.id,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
    }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/conversations/${currentConversation.id}/messages-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        },
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      const tempMessageId = Date.now().toString();
      const tempMessage: Message = {
        id: tempMessageId,
        role: "assistant",
        content: "",
        conversationId: currentConversation.id,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, tempMessage],
      }));

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
                  const calculateDelay = (char: string) => {
                    const baseDelay = 30;
                    const punctuationDelay = 200;
                    const sentenceEndDelay = 500;
                    const punctuationRegex = /[，。！？；：、]/;
                    const sentenceEndRegex = /[。！？]/;

                    if (sentenceEndRegex.test(char)) {
                      return baseDelay + sentenceEndDelay;
                    } else if (punctuationRegex.test(char)) {
                      return baseDelay + punctuationDelay;
                    } else {
                      return baseDelay;
                    }
                  };

                  let currentContent = fullContent;
                  for (const char of parsed.content) {
                    currentContent += char;

                    await new Promise((resolve) =>
                      setTimeout(resolve, calculateDelay(char)),
                    );

                    set((state) => ({
                      messages: state.messages.map((msg) =>
                        msg.id === tempMessageId
                          ? { ...msg, content: currentContent }
                          : msg,
                      ),
                    }));
                  }

                  fullContent = currentContent;
                } else if (parsed.error) {
                  console.error("流式响应错误:", parsed.error);
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

      set((state) => {
        const updatedMessages = state.messages.map((msg) =>
          msg.id === tempMessageId ? { ...msg, content: fullContent } : msg,
        );

        state.isSending = false;
        const activeConversations = new Map(state.activeConversations);
        activeConversations.set(currentConversation.id, {
          isSending: false,
          messages: updatedMessages,
        });

        return {
          messages: updatedMessages,
          isSending: false,
          activeConversations,
        };
      });

      if (isFirstMessage && fullContent) {
        try {
          const title = content.slice(0, 20);
          await get().updateConversation(currentConversation.id, { title });
        } catch (e) {
          // 静默失败
        }
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      set((state) => {
        state.isSending = false;
        const activeConversations = new Map(state.activeConversations);
        activeConversations.set(currentConversation.id, {
          isSending: false,
          messages: messages,
        });
        return { isSending: false, activeConversations };
      });
    }
  },

  // --- Models ---
  fetchModels: async (force = false) => {
    const { initialized } = get();
    if (!force && initialized.models) return;

    try {
      const models = await modelManagementApi.getAll();
      set({ models, initialized: { ...get().initialized, models: true } });
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  },

  // --- App by Id ---
  fetchAppById: async (id) => {
    const app = (await appsApi.getById(id)) as any;
    if (app) {
      if (!Array.isArray(app.nodes)) app.nodes = null;
      if (!Array.isArray(app.edges)) app.edges = null;
      // 将 embeddingModel 的 null 转换为 'none'
      app.embeddingModel =
        app.embeddingModel === null ? "none" : app.embeddingModel;
    }
    set({ currentApp: app });
  },

  deleteMessage: async (messageId) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    try {
      await conversationsApi.deleteMessage(currentConversation.id, messageId);
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));
    } catch (error) {
      console.error("删除消息失败:", error);
    }
  },

  saveAppFlow: async (id) => {
    const { nodes, edges } = useBuilderStore.getState();
    const cleanedNodes = nodes.map((node: any) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    }));
    const cleanedEdges = edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));
    const savedApp = await appsApi.saveFlow(id, { nodes: cleanedNodes, edges: cleanedEdges });
    
    // 更新 currentApp，确保数据一致
    if (savedApp) {
      const processedApp = {
        ...savedApp,
        embeddingModel: savedApp.embeddingModel === null ? "none" : savedApp.embeddingModel,
      };
      set((state) => ({
        currentApp: processedApp,
        apps: state.apps.map((a) => (a.id === id ? processedApp : a)),
      }));
    }
  },

  // --- Knowledge Bases ---
  fetchKnowledgeBases: async (force = false) => {
    const { initialized } = get();
    if (!force && initialized.knowledgeBases) return;

    try {
      const result = (await knowledgeApi.getAll()) as any;
      const knowledgeBases = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];
      set({
        knowledgeBases,
        initialized: { ...get().initialized, knowledgeBases: true },
      });
    } catch (error) {
      console.error("Failed to fetch knowledge bases:", error);
    }
  },

  fetchKnowledgeBaseById: async (id) => {
    const knowledgeBase = (await knowledgeApi.getById(id)) as any;
    set({ currentKnowledgeBase: knowledgeBase });
  },

  createKnowledgeBase: async (name, description) => {
    const newKb = await knowledgeApi.create({ name, description });
    set((state) => ({
      knowledgeBases: [newKb, ...state.knowledgeBases],
    }));
  },

  deleteKnowledgeBase: async (id) => {
    await knowledgeApi.delete(id);
    set((state) => ({
      knowledgeBases: state.knowledgeBases.filter((kb) => kb.id !== id),
      currentKnowledgeBase:
        state.currentKnowledgeBase?.id === id
          ? null
          : state.currentKnowledgeBase,
    }));
  },

  uploadDocument: async (knowledgeBaseId, file) => {
    await knowledgeApi.uploadDocument(knowledgeBaseId, file);
  },

  deleteDocument: async (documentId) => {
    await knowledgeApi.deleteDocument(documentId);
    set((state) => {
      if (!state.currentKnowledgeBase) return state;
      return {
        currentKnowledgeBase: {
          ...state.currentKnowledgeBase,
          documents: state.currentKnowledgeBase.documents?.filter(
            (doc) => doc.id !== documentId,
          ),
        },
      };
    });
  },
}));
