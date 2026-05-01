import { useState } from "react";
import type { App } from "@/types";
import { useAppStore } from "@/store/appStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Settings, Trash2 } from "lucide-react";
import EditAppDialog from "./EditAppDialog";

interface AppCardProps {
  app: App;
}

const AppCard = ({ app }: AppCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { deleteApp } = useAppStore();

  const handleDelete = async () => {
    if (confirm("确定要删除这个应用吗？")) {
      await deleteApp(app.id);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{app.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {app.description || "暂无描述"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 space-y-1">
            <p>默认模型: {app.defaultModel}</p>
            <p className="line-clamp-2">系统提示: {app.systemPrompt}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = `/apps/${app.id}/builder`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            编辑流程
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            基本信息
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </CardFooter>
      </Card>

      <EditAppDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        app={app}
      />
    </>
  );
};

export default AppCard;
