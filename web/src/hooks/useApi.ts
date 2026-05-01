import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  appsApi,
  conversationsApi,
  modelsApi,
  knowledgeApi,
} from "@/lib/api-client";
import { useUserStore } from "@/store/userStore";
import type {
  UpdateAppRequest,
  UpdateAppFlowRequest,
  UpdateConversationRequest,
  SendMessageRequest,
} from "@/types/api.types";

export const useAuth = () => {
  const loginMutation = useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      authApi.login({ email: params.email, password: params.password }),
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data;
      useUserStore.getState().setAuth(user, accessToken, refreshToken);
    },
    onError: (error) => {
      console.error("useAuth: 登录失败:", error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (params: { email: string; password: string; name?: string }) =>
      authApi.register({
        email: params.email,
        password: params.password,
        name: params.name,
      }),
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data;
      useUserStore.getState().setAuth(user, accessToken, refreshToken);
    },
    onError: (error) => {
      console.error("useAuth: 注册失败:", error);
    },
  });

  return {
    login: (email: string, password: string) =>
      loginMutation.mutateAsync({ email, password }),
    register: (email: string, password: string, name?: string) =>
      registerMutation.mutateAsync({ email, password, name }),
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.getCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

// ==================== 应用 Hooks ====================
export const useApps = () => {
  return useQuery({
    queryKey: ["apps"],
    queryFn: appsApi.getAll,
  });
};

export const useApp = (id: string | null) => {
  return useQuery({
    queryKey: ["app", id],
    queryFn: () => (id ? appsApi.getById(id) : null),
    enabled: !!id,
  });
};

export const useAppsMutations = () => {
  const queryClient = useQueryClient();

  const createAppMutation = useMutation({
    mutationFn: appsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppRequest }) =>
      appsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["app", variables.id] });
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: appsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.removeQueries({ queryKey: ["app", id] });
    },
  });

  const saveAppFlowMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppFlowRequest }) =>
      appsApi.saveFlow(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["app", variables.id] });
    },
  });

  return {
    createApp: createAppMutation.mutateAsync,
    updateApp: updateAppMutation.mutateAsync,
    deleteApp: deleteAppMutation.mutateAsync,
    saveAppFlow: saveAppFlowMutation.mutateAsync,
    isCreateAppPending: createAppMutation.isPending,
    isUpdateAppPending: updateAppMutation.isPending,
    isDeleteAppPending: deleteAppMutation.isPending,
    isSaveAppFlowPending: saveAppFlowMutation.isPending,
  };
};

// ==================== 对话 Hooks ====================
export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: conversationsApi.getAll,
  });
};

export const useConversation = (id: string | null) => {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => (id ? conversationsApi.getById(id) : null),
    enabled: !!id,
  });
};

export const useConversationsMutations = () => {
  const queryClient = useQueryClient();

  const createConversationMutation = useMutation({
    mutationFn: conversationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConversationRequest;
    }) => conversationsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.id],
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: conversationsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.removeQueries({ queryKey: ["conversation", id] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SendMessageRequest }) =>
      conversationsApi.sendMessage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.id],
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => conversationsApi.deleteMessage(conversationId, messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
    },
  });

  return {
    createConversation: createConversationMutation.mutateAsync,
    updateConversation: updateConversationMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    isCreateConversationPending: createConversationMutation.isPending,
    isUpdateConversationPending: updateConversationMutation.isPending,
    isDeleteConversationPending: deleteConversationMutation.isPending,
    isSendMessagePending: sendMessageMutation.isPending,
    isDeleteMessagePending: deleteMessageMutation.isPending,
  };
};

// ==================== 模型 Hooks ====================
export const useModels = () => {
  return useQuery({
    queryKey: ["models"],
    queryFn: modelsApi.getAll,
  });
};

// ==================== 知识库 Hooks ====================
export const useKnowledgeBases = () => {
  return useQuery({
    queryKey: ["knowledgeBases"],
    queryFn: knowledgeApi.getAll,
  });
};

export const useKnowledgeBase = (id: string | null) => {
  return useQuery({
    queryKey: ["knowledgeBase", id],
    queryFn: () => (id ? knowledgeApi.getById(id) : null),
    enabled: !!id,
  });
};

export const useKnowledgeMutations = () => {
  const queryClient = useQueryClient();

  const createKnowledgeBaseMutation = useMutation({
    mutationFn: knowledgeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeBases"] });
    },
  });

  const deleteKnowledgeBaseMutation = useMutation({
    mutationFn: knowledgeApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeBases"] });
      queryClient.removeQueries({ queryKey: ["knowledgeBase", id] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({
      knowledgeBaseId,
      file,
    }: {
      knowledgeBaseId: string;
      file: File;
    }) => knowledgeApi.uploadDocument(knowledgeBaseId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["knowledgeBase", variables.knowledgeBaseId],
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: knowledgeApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeBases"] });
    },
  });

  return {
    createKnowledgeBase: createKnowledgeBaseMutation.mutateAsync,
    deleteKnowledgeBase: deleteKnowledgeBaseMutation.mutateAsync,
    uploadDocument: uploadDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    isCreateKnowledgeBasePending: createKnowledgeBaseMutation.isPending,
    isDeleteKnowledgeBasePending: deleteKnowledgeBaseMutation.isPending,
    isUploadDocumentPending: uploadDocumentMutation.isPending,
    isDeleteDocumentPending: deleteDocumentMutation.isPending,
  };
};
