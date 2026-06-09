import { create } from "zustand";
import type { Model } from "@/types";
import { modelManagementApi } from "@/lib/api-client";

interface ModelState {
  models: Model[];
  initialized: boolean;

  fetchModels: (force?: boolean) => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  initialized: false,

  fetchModels: async (force = false) => {
    const { initialized } = get();
    if (!force && initialized) return;

    try {
      const models = await modelManagementApi.getAll();
      set({ models, initialized: true });
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  },
}));