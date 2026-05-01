import { useState, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AppCard from "@/components/apps/AppCard";
import EditAppDialog from "@/components/apps/EditAppDialog";

const Apps = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const apps = useAppStore((state) => state.apps);
  const fetchModels = useAppStore((state) => state.fetchModels);

  useEffect(() => {
    // 确保模型数据已加载
    fetchModels();
  }, [fetchModels]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">应用管理</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建应用
        </Button>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <h3 className="text-lg font-medium mb-2">暂无应用</h3>
          <p className="mb-4">创建您的第一个AI应用开始使用</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建应用
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}

      <EditAppDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        app={null}
      />
    </div>
  );
};

export default Apps;
