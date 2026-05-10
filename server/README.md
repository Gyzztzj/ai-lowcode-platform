# AI 低代码平台 - 后端服务

AI低代码平台的后端服务，基于NestJS框架构建。

## 📋 项目概述

后端服务提供完整的REST API，包括：
- 用户认证与授权
- 应用管理
- 工作流执行引擎
- 知识库管理与RAG系统
- AI对话与会话管理
- OpenAI兼容API
- API Key管理

## 🛠️ 技术栈

- **框架**: NestJS 11.0.1
- **语言**: TypeScript 5.7.3
- **ORM**: TypeORM 0.3.28
- **数据库**: PostgreSQL + pgvector
- **缓存**: Redis
- **认证**: JWT + bcrypt
- **AI集成**: LangChain + OpenAI SDK
- **API文档**: Swagger

## 🚀 快速开始

### 环境要求
- Node.js >= 20
- pnpm >= 8
- PostgreSQL >= 14
- Redis >= 7

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
PORT=3000
NODE_ENV=development

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ai-lowcode

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# 允许的跨域源
ALLOWED_ORIGINS=http://localhost:5173

# AI 配置
OPENAI_API_KEY=your-openai-api-key
DOUBAO_API_KEY=your-doubao-api-key
```

### 开发模式

```bash
pnpm start:dev
```

服务默认运行在 http://localhost:3000

API文档地址：http://localhost:3000/api/docs

### 生产构建

```bash
pnpm build
pnpm start:prod
```

### 运行测试

```bash
# 单元测试
pnpm test

# 测试覆盖率
pnpm test:cov
```

## 📁 项目结构

```
server/
├── src/
│   ├── ai/                    # AI相关服务
│   ├── api-keys/              # API Key管理
│   ├── apps/                  # 应用管理
│   ├── audit/                 # 审计日志
│   ├── auth/                  # 认证模块
│   ├── common/                # 公共模块
│   ├── context/               # 上下文管理
│   ├── conversations/         # 会话管理
│   ├── database/              # 数据库模块
│   ├── decorators/            # 装饰器
│   ├── entities/              # 数据库实体
│   ├── executor/              # 工作流执行器
│   ├── factory/               # 工厂模式
│   ├── filters/               # 异常过滤器
│   ├── flow/                  # 工作流服务
│   ├── guards/                # 守卫
│   ├── knowledge/             # 知识库管理
│   ├── models/                # 模型管理
│   ├── openai/                # OpenAI兼容API
│   ├── public-api/            # 公开API
│   ├── rag/                   # RAG系统 (DDD架构)
│   ├── rate-limit/            # 限流
│   ├── recycle-bin/           # 回收站
│   ├── redis/                 # Redis模块
│   ├── repositories/          # 数据仓库
│   ├── resource-management/   # 资源管理
│   ├── system-config/         # 系统配置
│   ├── token-usage/           # Token使用统计
│   ├── transformers/          # 向量转换器
│   ├── utils/                 # 工具函数
│   ├── app.module.ts          # 根模块
│   ├── app.service.ts         # 根服务
│   ├── app.controller.ts      # 根控制器
│   └── main.ts                # 应用入口
├── init-db/                   # 数据库初始化脚本
├── .env.example               # 环境变量模板
├── Dockerfile                 # Docker配置
└── package.json
```

## 🔌 API端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 应用管理
- `GET /api/apps` - 获取应用列表
- `POST /api/apps` - 创建应用
- `PUT /api/apps/:id` - 更新应用
- `DELETE /api/apps/:id` - 删除应用

### 知识库
- `GET /api/knowledge` - 获取知识库列表
- `POST /api/knowledge` - 创建知识库
- `POST /api/knowledge/:id/documents` - 上传文档

### 会话
- `GET /api/conversations` - 获取会话列表
- `POST /api/conversations` - 创建会话
- `POST /api/conversations/:id/messages` - 发送消息
- `POST /api/conversations/:id/messages-stream` - 流式发送消息

### OpenAI兼容
- `POST /api/openai/chat/completions` - 聊天完成

完整API文档请访问：http://localhost:3000/api/docs

## 📚 相关文档

- [后端技术文档](../docs/服务端技术文档.md)
- [后端部署文档](../docs/服务端部署文档.md)
- [本地Docker部署说明](../docs/本地Docker部署说明.md)
