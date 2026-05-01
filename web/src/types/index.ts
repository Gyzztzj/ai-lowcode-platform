// 用户类型
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
}

// 应用类型
export interface App {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  defaultModel: string;
  embeddingModel: string | null;
  shareId?: string | null;
  nodes?: unknown;
  edges?: unknown;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 对话类型
export interface Conversation {
  id: string;
  title: string;
  appId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  app?: {
    id: string;
    name: string;
    defaultModel?: string;
  };
}

// 消息类型
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  conversationId: string;
  createdAt: string;
}

// 模型类型枚举
export type ModelType = "CHAT" | "VISION" | "MULTIMODAL" | "AUDIO" | "EMBEDDING";

// 模型类型
export interface Model {
  id: string;
  name: string;
  modelId: string;
  provider: string;
  type: ModelType;
  apiKey: string;
  apiEndpoint: string;
  description: string | null;
  enabled: boolean;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 知识库类型
export interface Document {
  id: string;
  name: string;
  fileSize: number;
  chunkCount?: number;
  status: string;
  createdAt: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  documents?: Document[];
  _count?: {
    documents: number;
  };
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
