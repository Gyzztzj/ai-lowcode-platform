import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const { user, isLoading, fetchCurrentUser } = useUserStore();
  const location = useLocation();
  const [loadingComplete, setLoadingComplete] = useState(false);

  // 初始化检查
  useEffect(() => {
    const localStorageToken = localStorage.getItem("token");

    // 如果没有 token 或者有 user，直接完成
    if (!localStorageToken || user) {
      setLoadingComplete(true);
      return;
    }

    // 如果有 token 但没有 user，尝试获取用户信息
    if (localStorageToken && !user) {
      fetchCurrentUser().finally(() => {
        setLoadingComplete(true);
      });
    }
  }, [user, fetchCurrentUser]);

  // 安全超时保护
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadingComplete) {
        console.warn("ProtectedRoute: 加载超时，清除认证信息");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        useUserStore.setState({
          isLoading: false,
          user: null,
          token: null,
          refreshToken: null,
        });
        setLoadingComplete(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loadingComplete]);

  // 如果还在加载过程中，显示 loading
  if (!loadingComplete || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 如果没有用户，重定向到登录
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
