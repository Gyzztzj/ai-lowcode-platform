# AI 低代码平台 - 前端应用

AI低代码平台的前端应用，基于React + TypeScript + Vite构建。

## 📋 项目概述

前端应用提供直观的用户界面，包括：
- 可视化工作流编辑器
- 应用管理界面
- AI对话界面
- 知识库管理
- 模型配置
- 用户认证

## 🛠️ 技术栈

- **框架**: React 19.2.4
- **语言**: TypeScript 6.0.2
- **构建工具**: Vite 8.0.4
- **状态管理**: Zustand 5.0.12
- **工作流可视化**: React Flow 11.11.4
- **UI组件**: ShadCN UI + TailwindCSS 4.2.2
- **数据请求**: TanStack Query + Axios 1.15.0
- **数据验证**: Zod 4.3.6
- **测试**: Vitest 2.1.8

## 🚀 快速开始

### 环境要求
- Node.js >= 20
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件（通常不需要修改）：

```env
VITE_API_URL=http://localhost:3000/api
```

### 开发模式

```bash
pnpm dev
```

应用默认运行在 http://localhost:5173

### 生产构建

```bash
pnpm build
```

### 预览构建

```bash
pnpm preview
```

### 运行测试

```bash
pnpm test
```

## 📁 项目结构

```
web/
├── src/
│   ├── components/
│   │   ├── api-keys/          # API Key管理组件
│   │   ├── apps/              # 应用管理组件
│   │   ├── builder/           # 工作流编辑器
│   │   │   ├── nodes/         # 节点组件
│   │   │   ├── panels/        # 面板组件
│   │   │   └── BuilderCanvas.tsx
│   │   ├── chat/              # 对话组件
│   │   ├── layout/            # 布局组件
│   │   ├── models/            # 模型管理组件
│   │   ├── ui/                # ShadCN UI组件
│   │   └── ProtectedRoute.tsx # 路由保护
│   ├── hooks/                 # 自定义Hooks
│   ├── lib/                   # 工具库
│   │   ├── api-client.ts      # API客户端
│   │   ├── axios.ts           # Axios配置
│   │   └── utils.ts           # 工具函数
│   ├── pages/                 # 页面组件
│   │   ├── Apps.tsx
│   │   ├── Builder.tsx
│   │   ├── Chat.tsx
│   │   ├── Knowledge.tsx
│   │   ├── KnowledgeDetail.tsx
│   │   ├── Login.tsx
│   │   ├── ModelManagement.tsx
│   │   ├── Register.tsx
│   │   └── Share.tsx
│   ├── store/                 # Zustand状态管理
│   │   ├── appStore.ts        # 应用状态
│   │   ├── builderStore.ts    # 编辑器状态
│   │   └── userStore.ts       # 用户状态
│   ├── types/                 # TypeScript类型定义
│   ├── App.css                # 全局样式
│   ├── App.tsx                # 根组件
│   ├── AppRoutes.tsx          # 路由配置
│   ├── index.css              # 基础样式
│   └── main.tsx               # 应用入口
├── public/                    # 静态资源
├── .env.example               # 环境变量模板
├── Dockerfile                 # Docker配置
├── nginx.conf                 # Nginx配置
└── package.json
```

## 🎨 主要页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | Login | 登录页面 |
| `/register` | Register | 注册页面 |
| `/apps` | Apps | 应用列表 |
| `/apps/:appId/builder` | Builder | 工作流编辑器 |
| `/chat` | Chat | AI对话 |
| `/knowledge` | Knowledge | 知识库列表 |
| `/knowledge/:id` | KnowledgeDetail | 知识库详情 |
| `/models` | ModelManagement | 模型管理 |

## 📚 相关文档

- [前端技术文档](../docs/前端技术文档.md)
- [前端部署文档](../docs/前端部署文档.md)
- [本地Docker部署说明](../docs/本地Docker部署说明.md)
