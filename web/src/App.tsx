import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import AppRoutes from "./AppRoutes";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "./store/appStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

const AppInitializer = () => {
  const fetchApps = useAppStore((state) => state.fetchApps);
  const fetchModels = useAppStore((state) => state.fetchModels);
  const fetchKnowledgeBases = useAppStore((state) => state.fetchKnowledgeBases);
  const fetchConversations = useAppStore((state) => state.fetchConversations);

  useEffect(() => {
    // 全局初始化数据
    fetchApps();
    fetchModels();
    fetchKnowledgeBases();
    fetchConversations();
  }, [fetchApps, fetchModels, fetchKnowledgeBases, fetchConversations]);

  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppInitializer />
        <AppRoutes />
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
