import api from "./axios";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  ChangePasswordRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  CreateAppRequest,
  UpdateAppRequest,
  UpdateAppFlowRequest,
  ValidateFlowRequest,
  PreviewFlowRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  ConversationDetail,
  ModelsResponse,
  CreateKnowledgeBaseRequest,
  CreateModelRequest,
  UpdateModelRequest,
} from "@/types/api.types";
import type { User, App, Conversation, KnowledgeBase, Model } from "@/types";

// ==================== 认证 API ====================
export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post("/auth/login", data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post("/auth/register", data),

  getCurrentUser: (): Promise<{ user: User }> => api.get("/auth/me"),

  refreshToken: (data: RefreshTokenRequest): Promise<RefreshTokenResponse> =>
    api.post("/auth/refresh", data),

  logout: (data?: LogoutRequest): Promise<{ message: string }> =>
    api.post("/auth/logout", data),

  changePassword: (data: ChangePasswordRequest): Promise<{ message: string }> =>
    api.post("/auth/password/change", data),

  requestPasswordReset: (
    data: RequestPasswordResetRequest,
  ): Promise<{ message: string; token?: string }> =>
    api.post("/auth/password/request-reset", data),

  resetPassword: (data: ResetPasswordRequest): Promise<{ message: string }> =>
    api.post("/auth/password/reset", data),
};

// ==================== 应用 API ====================
export const appsApi = {
  getAll: (): Promise<App[]> => api.get("/apps"),

  getById: (id: string): Promise<App> => api.get(`/apps/${id}`),

  create: (data: CreateAppRequest): Promise<App> => api.post("/apps", data),

  update: (id: string, data: UpdateAppRequest): Promise<App> =>
    api.patch(`/apps/${id}`, data),

  delete: (id: string): Promise<void> => api.delete(`/apps/${id}`),

  saveFlow: (id: string, data: UpdateAppFlowRequest): Promise<App> =>
    api.patch(`/apps/${id}/flow`, data),

  validateFlow: (
    data: ValidateFlowRequest,
  ): Promise<{ valid: boolean; errors: string[] }> =>
    api.post("/apps/validate", data),

  previewFlow: (data: PreviewFlowRequest): Promise<{ result: unknown }> =>
    api.post("/apps/preview", data),

  publish: (id: string): Promise<App> => api.post(`/apps/${id}/publish`),

  getByShareId: (shareId: string): Promise<App> =>
    api.get(`/apps/share/${shareId}`),

  shareChat: (
    shareId: string,
    data: { userInput: string },
  ): Promise<{ result: unknown }> =>
    api.post(`/apps/share/${shareId}/chat`, data),
};

// ==================== 对话 API ====================
export const conversationsApi = {
  getAll: (): Promise<Conversation[]> => api.get("/conversations"),

  getById: (id: string): Promise<ConversationDetail> =>
    api.get(`/conversations/${id}`),

  create: (data: CreateConversationRequest): Promise<Conversation> =>
    api.post("/conversations", data),

  update: (
    id: string,
    data: UpdateConversationRequest,
  ): Promise<Conversation> => api.patch(`/conversations/${id}`, data),

  delete: (id: string): Promise<void> => api.delete(`/conversations/${id}`),

  sendMessage: (
    id: string,
    data: SendMessageRequest,
  ): Promise<SendMessageResponse> =>
    api.post(`/conversations/${id}/messages`, data),

  deleteMessage: (conversationId: string, messageId: string): Promise<void> =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}`),
};

// ==================== 模型管理 API ====================
export const modelManagementApi = {
  getAll: (): Promise<Model[]> => api.get("/models"),

  getById: (id: string): Promise<Model> => api.get(`/models/${id}`),

  create: (data: CreateModelRequest): Promise<Model> =>
    api.post("/models", data),

  update: (id: string, data: UpdateModelRequest): Promise<Model> =>
    api.patch(`/models/${id}`, data),

  delete: (id: string): Promise<void> => api.delete(`/models/${id}`),
};

// ==================== 模型 API ====================
export const modelsApi = {
  getAll: (): Promise<ModelsResponse> => api.get("/ai/models"),
};

// ==================== 知识库 API ====================
export const knowledgeApi = {
  getAll: (): Promise<KnowledgeBase[]> => api.get("/knowledge"),

  getById: (id: string): Promise<KnowledgeBase> => api.get(`/knowledge/${id}`),

  create: (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> =>
    api.post("/knowledge", data),

  delete: (id: string): Promise<void> => api.delete(`/knowledge/${id}`),

  uploadDocument: (knowledgeBaseId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/knowledge/${knowledgeBaseId}/documents`, formData);
  },

  deleteDocument: (documentId: string): Promise<void> =>
    api.delete(`/knowledge/documents/${documentId}`),
};

// ==================== API 密钥 API ====================
export interface ApiKey {
  id: string;
  name: string;
  key?: string;
  status: string;
  permissions: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  requestCount: number;
  createdAt: string;
  appId: string | null;
  app?: App;
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  permissions?: string[];
  expiresAt?: string;
  rateLimitRequests?: number;
  rateLimitWindow?: string;
  appId?: string;
}

export const apiKeysApi = {
  getAll: (): Promise<ApiKey[]> => api.get("/api-keys"),

  getByAppId: (appId: string): Promise<ApiKey[]> => api.get(`/api-keys/apps/${appId}`),

  create: (data: CreateApiKeyRequest): Promise<{
    id: string;
    name: string;
    key: string;
    status: string;
    permissions: string[];
    expiresAt: string | null;
    createdAt: string;
    appId: string | null;
  }> => api.post("/api-keys", data),

  refresh: (id: string, data?: { expiresAt?: string; permissions?: string[] }): Promise<{
    id: string;
    name: string;
    key: string;
    status: string;
    permissions: string[];
    expiresAt: string | null;
    createdAt: string;
  }> => api.post(`/api-keys/${id}/refresh`, data || {}),

  revoke: (id: string): Promise<{ id: string; name: string; status: string }> =>
    api.post(`/api-keys/${id}/revoke`),

  activate: (id: string): Promise<{ id: string; name: string; status: string }> =>
    api.post(`/api-keys/${id}/activate`),

  delete: (id: string): Promise<void> => api.delete(`/api-keys/${id}`),
};
