import type { User, Message, Model, Conversation } from "./index";

// ==================== API 基础类型 ====================
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// ==================== 认证 API 类型 ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ==================== 应用 API 类型 ====================
export interface CreateAppRequest {
  name: string;
  description?: string | null;
  systemPrompt?: string;
  defaultModel?: string;
  embeddingModel?: string;
  isPublic?: boolean;
}

export interface UpdateAppRequest {
  name?: string;
  description?: string | null;
  systemPrompt?: string;
  defaultModel?: string;
  embeddingModel?: string;
  isPublic?: boolean;
  nodes?: unknown;
  edges?: unknown;
}

export interface UpdateAppFlowRequest {
  nodes: unknown;
  edges: unknown;
}

// ==================== 对话 API 类型 ====================
export interface CreateConversationRequest {
  appId: string;
  title?: string;
}

export interface UpdateConversationRequest {
  title: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  message: Message;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

// ==================== 模型 API 类型 ====================
export interface ModelsResponse {
  models: Model[];
}

export interface CreateModelRequest {
  name: string;
  modelId: string;
  provider: string;
  type: "CHAT" | "VISION" | "MULTIMODAL" | "AUDIO" | "EMBEDDING";
  apiKey: string;
  apiEndpoint: string;
  description?: string;
  enabled?: boolean;
}

export interface UpdateModelRequest {
  name?: string;
  modelId?: string;
  provider?: string;
  type?: "CHAT" | "VISION" | "MULTIMODAL" | "AUDIO" | "EMBEDDING";
  apiKey?: string;
  apiEndpoint?: string;
  description?: string;
  enabled?: boolean;
}

// ==================== 知识库 API 类型 ====================
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
}

export interface ValidateFlowRequest {
  nodes: unknown;
  edges: unknown;
}

export interface PreviewFlowRequest {
  nodes: unknown;
  edges: unknown;
  userInput: string;
  appId?: string;
}

export type PublishAppRequest = object;

export interface ShareChatRequest {
  userInput: string;
}
