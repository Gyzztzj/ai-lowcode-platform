# AI 低代码平台

一个功能强大的AI低代码平台，支持可视化工作流编排、知识库管理、AI对话和OpenAI兼容API。

## 🚀 功能特性

### 核心功能
- **可视化工作流编辑器** - 拖拽式节点编排，支持多种节点类型
- **工作流引擎** - 强大的执行引擎，支持条件分支、变量管理等
- **知识库管理** - 支持多种文档格式，自动分块向量化
- **RAG系统** - 检索增强生成，提升AI回答准确率
- **AI对话** - 支持流式响应，会话历史管理
- **OpenAI兼容API** - 可作为代理服务使用
- **用户认证** - JWT + API Key双重认证

### 工作流节点类型
- 🟢 **开始节点** - 工作流入口
- 🔴 **结束节点** - 工作流出口
- 💬 **用户输入** - 接收用户输入
- 📝 **系统提示词** - 设置AI角色
- 🤖 **LLM调用** - 调用AI模型
- 📚 **知识库检索** - 从知识库获取相关信息
- 🔀 **条件分支** - 逻辑判断
- ⚙️ **变量设置** - 设置流程变量

## 🛠️ 技术栈

### 后端
- **框架** - NestJS 11.0.1
- **语言** - TypeScript 5.7.3
- **ORM** - TypeORM 0.3.28
- **数据库** - PostgreSQL + pgvector
- **缓存** - Redis
- **认证** - JWT + bcrypt
- **AI集成** - LangChain + OpenAI SDK
- **API文档** - Swagger

### 前端
- **框架** - React 19.2.4
- **语言** - TypeScript 6.0.2
- **构建工具** - Vite 8.0.4
- **状态管理** - Zustand 5.0.12
- **工作流可视化** - React Flow 11.11.4
- **UI组件** - ShadCN UI + TailwindCSS 4.2.2
- **数据请求** - TanStack Query + Axios

## 📦 快速开始

### 环境要求
- Node.js >= 20
- pnpm >= 8
- PostgreSQL >= 14
- Redis >= 7

### 本地开发

#### 方式一：Docker部署（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd ai-lowcode-platform

# 启动所有服务
docker-compose up -d

# 访问应用
# 前端: http://localhost:5173
# 后端API: http://localhost:3000
# API文档: http://localhost:3000/api/docs
```

#### 方式二：手动部署

**1. 启动数据库和Redis**

```bash
docker-compose up -d postgres redis
```

**2. 配置环境变量**

```bash
# 后端
cd server
cp .env.example .env
# 编辑 .env 文件，配置数据库连接和API密钥

# 前端
cd ../web
cp .env.example .env
```

**3. 安装依赖并启动**

```bash
# 后端
cd server
pnpm install
pnpm start:dev

# 前端（新开终端）
cd ../web
pnpm install
pnpm dev
```

## 📖 文档

- [前端技术文档](docs/前端技术文档.md)
- [后端技术文档](docs/服务端技术文档.md)
- [前端部署文档](docs/前端部署文档.md)
- [后端部署文档](docs/服务端部署文档.md)
- [本地Docker部署说明](docs/本地Docker部署说明.md)
- [CI/CD配置指南](CI-CD.md)
- [贡献指南](CONTRIBUTING.md)

## 🏗️ 项目结构

```
ai-lowcode-platform/
├── server/              # 后端服务
│   ├── src/            # 源代码
│   ├── init-db/        # 数据库初始化脚本
│   └── package.json
├── web/                # 前端应用
│   ├── src/            # 源代码
│   └── package.json
├── docs/               # 文档
├── .github/            # GitHub Actions
├── docker-compose.yml  # Docker编排
└── package.json        # 根包管理
```

## 🤝 贡献

欢迎提交Issue和Pull Request！请先阅读[贡献指南](CONTRIBUTING.md)。

## 📄 许可证

MIT License

## 🔗 相关链接

- [NestJS官方文档](https://nestjs.com/)
- [React官方文档](https://react.dev/)
- [React Flow](https://reactflow.dev/)
