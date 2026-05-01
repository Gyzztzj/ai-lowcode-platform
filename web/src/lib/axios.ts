import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { authApi } from "./api-client";
import { useUserStore } from "@/store/userStore";

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 增加到 120 秒，因为大模型请求可能需要更长时间
});

// Token刷新状态管理
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// 请求拦截器：添加认证token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 对于 FormData，让浏览器自动设置 Content-Type
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    } else if (config.headers && !config.headers['Content-Type']) {
      // 对于非 FormData 请求，默认设置为 application/json
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器：统一处理错误和token刷新
api.interceptors.response.use(
  (response) => {
    const result = response.data as {
      code: number;
      message?: string;
      data?: unknown;
    };
    if (result.code === 0) {
      return result.data as any;
    }
    throw new Error(result.message || "请求失败");
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401未授权处理
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新token，等待刷新完成
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("没有刷新令牌");
        }

        // 调用刷新token接口
        const response = await authApi.refreshToken({ refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response;

        // 更新token存储
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // 更新store
        const userStore = useUserStore.getState();
        userStore.setToken(accessToken);

        // 通知等待的请求
        onTokenRefreshed(accessToken);

        // 重试原请求
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除token并登出
        console.error("Token刷新失败:", refreshError);
        
        // 清除所有token
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        
        // 更新store状态
        const userStore = useUserStore.getState();
        userStore.logout();
        
        // 通知等待的请求刷新失败
        onTokenRefreshed("");

        // 如果不是登录页面，才显示错误并跳转
        if (!window.location.pathname.includes("/login")) {
          toast.error("登录已过期，请重新登录", {
            description: "请重新登录",
          });
          
          // 使用 replace 避免重复历史记录
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 401) {
      // 如果是第二次401或者重试失败
      console.error("认证失败，清除token");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      
      const userStore = useUserStore.getState();
      userStore.logout();
      
      if (!window.location.pathname.includes("/login")) {
        window.location.replace("/login");
      }
    }

    // 其他错误处理
    if (error.response) {
      const errorData = error.response.data as { message?: string };
      const errorMsg = errorData.message || "服务器错误";
      
      // 根据 HTTP 状态码给出更明确的错误提示
      let errorTitle = "请求失败";
      if (error.response.status === 400) {
        errorTitle = "请求参数错误";
      } else if (error.response.status === 401) {
        errorTitle = "未授权";
      } else if (error.response.status === 403) {
        errorTitle = "无权限访问";
      } else if (error.response.status === 404) {
        errorTitle = "资源不存在";
      } else if (error.response.status >= 500) {
        errorTitle = "服务器错误";
      }
      
      toast.error(errorTitle, {
        description: errorMsg,
      });
    } else if (error.request) {
      toast.error("网络错误", {
        description: "无法连接到服务器，请检查您的网络连接",
      });
    } else {
      toast.error("请求错误", {
        description: error.message || "请求配置错误",
      });
    }

    return Promise.reject(error);
  },
);

export default api;
