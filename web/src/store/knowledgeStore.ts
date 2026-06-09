import { create } from "zustand";
import type { KnowledgeBase } from "@/types";
import { knowledgeApi } from "@/lib/api-client";

interface KnowledgeState {
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: KnowledgeBase | null;
  initialized: boolean;

  fetchKnowledgeBases: (force?: boolean) => Promise<void>;
  fetchKnowledgeBaseById: (id: string) => Promise<void>;
  createKnowledgeBase: (name: string, description?: string) => Promise<void>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  uploadDocument: (knowledgeBaseId: string, file: File) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

function normalizeListResult(result: unknown): KnowledgeBase[] {
  if (Array.isArray(result)) return result;
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    Array.isArray((result as { data?: unknown }).data)
  ) {
    return (result as { data: KnowledgeBase[] }).data;
  }
  return [];
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  knowledgeBases: [],
  currentKnowledgeBase: null,
  initialized: false,

  fetchKnowledgeBases: async (force = false) => {
    const { initialized } = get();
    if (!force && initialized) return;

    try {
      const result = await knowledgeApi.getAll();
      const knowledgeBases = normalizeListResult(result);
      set({ knowledgeBases, initialized: true });
    } catch (error) {
      console.error("Failed to fetch knowledge bases:", error);
    }
  },

  fetchKnowledgeBaseById: async (id) => {
    const knowledgeBase = await knowledgeApi.getById(id);
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