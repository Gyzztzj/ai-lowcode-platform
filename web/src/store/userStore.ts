import { create } from "zustand";
import type { User } from "@/types/index";
import { authApi } from "@/lib/api-client";

interface UserState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  setAuth: (user: User, accessToken: string, refreshTokenVal?: string) => void;
  setToken: (token: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  isLoading: false, // 初始设为 false，在 fetchCurrentUser 中再设为 true

  logout: async () => {
    try {
      const { refreshToken } = get();
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (error) {
      console.error("userStore: 调用后端 logout API 失败:", error);
    }
    
    localStorage.clear();
    sessionStorage.clear();
    
    set({ user: null, token: null, refreshToken: null, isLoading: false });
  },

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true });
      const response = await authApi.getCurrentUser();
      set({ user: response.user, isLoading: false });
    } catch (error) {
      console.error("userStore: fetchCurrentUser 失败:", error);
      // 清除所有认证信息
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      set({ 
        user: null, 
        token: null, 
        refreshToken: null, 
        isLoading: false 
      });
    }
  },
  
  setAuth: (user, accessToken, refreshTokenVal) => {
    localStorage.setItem("token", accessToken);
    if (refreshTokenVal) {
      localStorage.setItem("refreshToken", refreshTokenVal);
    }
    set({ user, token: accessToken, refreshToken: refreshTokenVal || null, isLoading: false });
  },

  setToken: (token) => {
    localStorage.setItem("token", token);
    set({ token });
  },
}));
