import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MessageSquare, Settings, Cpu, Shield, BarChart3 } from "lucide-react";
import { BookOpen } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const routes = [
    {
      path: "/chat",
      name: "AI对话",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      path: "/apps",
      name: "应用管理",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      path: "/models",
      name: "模型管理",
      icon: <Cpu className="h-5 w-5" />,
    },
    {
      path: "/knowledge",
      name: "知识库管理",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      path: "/roles",
      name: "角色管理",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      path: "/quota",
      name: "配额管理",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">AI低代码平台</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location.pathname.startsWith(route.path)
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            {route.icon}
            {route.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
