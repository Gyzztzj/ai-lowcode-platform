# AI 低代码平台部署文档

## 目录

- [项目概述](#项目概述)
- [环境变量配置](#环境变量配置)
- [Vercel 部署教程](#vercel-部署教程)
- [Render 部署教程](#render-部署教程)
- [项目构建流程](#项目构建流程)
- [CI/CD 配置](#cicd-配置)
- [常见问题排查](#常见问题排查)

---

## 项目概述

AI 低代码平台是一个全栈应用，包含：

- **前端**：React + Vite + Tailwind CSS（`web/` 目录）
- **后端**：NestJS + TypeORM + PostgreSQL + Redis（`server/` 目录）

技术栈：
- 前端：React 19, Vite 8, Tailwind CSS 4
- 后端：NestJS 11, TypeORM, pgvector, Redis
- 数据库：PostgreSQL 18 + pgvector
- AI 服务：豆包、通义千问

---

## 环境变量配置

### 后端环境变量（server/）

| 变量名 | 含义 | 必填 | 默认值 | 取值范围/说明 | 安全注意事项 |
|--------|------|------|--------|---------------|--------------|
| `NODE_ENV` | 运行环境 | 否 | `development` | `development` / `production` / `test` | 生产环境必须设置为 `production` |
| `PORT` | 服务端口 | 否 | `3000` | 1024-65535 | 生产环境建议使用标准端口 |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 | - | 格式：`postgresql://user:pass@host:5432/db?schema=public` | 包含密码，使用加密的密钥管理 |
| `REDIS_URL` | Redis 连接字符串 | 是 | - | 格式：`redis://host:6379` | Redis 需配置密码认证 |
| `JWT_SECRET` | JWT 签名密钥 | 是 | - | 32+ 字符的随机字符串 | 必须使用强随机密钥，定期轮换 |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access Token 有效期 | 否 | `1h` | 例如：`1h`, `24h`, `7d` | 根据安全需求调整 |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh Token 有效期 | 否 | `7d` | 例如：`7d`, `30d` | 根据安全需求调整 |
| `DOUBAO_CHAT_API_KEY` | 豆包 Chat API Key | 否 | - | 火山引擎 ARK API Key | 保密存储，限制 IP 访问 |
| `DOUBAO_DEFAULT_CHAT_MODEL` | 豆包默认 Chat 模型 | 否 | `doubao-seed-2-0-pro-260215` | 豆包模型列表 | - |
| `DOUBAO_CHAT_URL` | 豆包 Chat API URL | 否 | `https://ark.cn-beijing.volces.com/api/v3/chat/completions` | 火山引擎 ARK 端点 | - |
| `DOUBAO_EMBEDDING_API_KEY` | 豆包 Embedding API Key | 否 | - | 火山引擎 ARK API Key | 保密存储 |
| `DOUBAO_DEFAULT_EMBEDDING_MODEL` | 豆包默认 Embedding 模型 | 否 | `doubao-embedding-vision-251215` | 豆包 Embedding 模型 | - |
| `DOUBAO_EMBEDDING_URL` | 豆包 Embedding API URL | 否 | `https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal` | 火山引擎 ARK 端点 | - |
| `DOUBAO_EMBEDDING_DIMENSION` | 豆包 Embedding 向量维度 | 否 | `1024` | 根据模型支持设置 | - |
| `DASHSCOPE_CHAT_API_KEY` | 通义千问 Chat API Key | 否 | - | 阿里云 DashScope API Key | 保密存储 |
| `QWEN_DEFAULT_CHAT_MODEL` | 通义千问默认 Chat 模型 | 否 | `qvq-max-2025-03-25` | 通义千问模型列表 | - |
| `QWEN_CHAT_URL` | 通义千问 Chat API URL | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | DashScope 端点 | - |
| `DASHSCOPE_EMBEDDING_API_KEY` | 通义千问 Embedding API Key | 否 | - | 阿里云 DashScope API Key | 保密存储 |
| `QWEN_EMBEDDING_URL` | 通义千问 Embedding API URL | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings` | DashScope 端点 | - |
| `QWEN_EMBEDDING_DIMENSION` | 通义千问 Embedding 向量维度 | 否 | `1024` | 根据模型支持设置 | - |
| `QWEN_DEFAULT_EMBEDDING_MODEL` | 通义千问默认 Embedding 模型 | 否 | `gte-rerank-v2` | 通义千问 Embedding 模型 | - |

### 前端环境变量（web/）

| 变量名 | 含义 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `VITE_API_BASE_URL` | 后端 API 基础 URL | 否 | `/api` | 生产环境需设置为完整 URL |

---

## Vercel 部署教程

### 1. 准备工作

- 注册 Vercel 账号：https://vercel.com
- 将代码推送到 GitHub/GitLab/Bitbucket 仓库

### 2. 部署后端（可选）

> 注意：Vercel 主要适合部署前端和 Serverless 函数，后端建议使用 Render。

### 3. 部署前端

#### 步骤 1：导入项目

1. 登录 Vercel 控制台
2. 点击 **"New Project"**
3. 选择你的代码仓库
4. 点击 **"Import"**

#### 步骤 2：配置项目

1. **Project Name**：输入项目名称（如 `ai-lowcode-web`）
2. **Root Directory**：设置为 `web`
3. **Framework Preset**：Vercel 会自动检测为 Vite
4. **Build Command**：自动填充为 `npm run build`
5. **Output Directory**：自动填充为 `dist`
6. **Install Command**：自动填充为 `npm install`

#### 步骤 3：配置环境变量

在 **Environment Variables** 部分添加：

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://your-backend-url.com` |

#### 步骤 4：部署

点击 **"Deploy"** 按钮开始部署。

### 4. 自定义域名（可选）

1. 进入项目设置 → **Domains**
2. 添加你的域名
3. 按照提示配置 DNS 记录

---

## Render 部署教程

### 1. 准备工作

- 注册 Render 账号：https://render.com
- 将代码推送到 GitHub/GitLab/Bitbucket 仓库
- 确保 `server/render.yaml` 文件存在

### 2. 一键部署

#### 步骤 1：创建 Blueprint

1. 登录 Render 控制台
2. 点击 **"New"** → **"Blueprint"**
3. 选择你的代码仓库
4. 点击 **"Continue"**
5. **Blueprint Name**：输入名称（如 `ai-lowcode-platform`）
6. **Branch**：选择部署分支（如 `main`）
7. **Root Directory**：保持为空或设置为 `server`
8. 点击 **"Apply"**

#### 步骤 2：配置环境变量

Render 会自动读取 `server/render.yaml` 中的配置：
- `DATABASE_URL`：自动关联 PostgreSQL 数据库
- `REDIS_URL`：自动关联 Redis 服务
- `JWT_SECRET`：自动生成安全密钥
- `NODE_ENV`：自动设置为 `production`
- `PORT`：自动设置为 `10000`

手动添加其他环境变量（如 AI API Key）：

1. 在 Render 控制台中，进入 **Web Service** → **Environment**
2. 点击 **"Add Environment Variable"**
3. 添加所需的 AI API Key 变量

#### 步骤 3：等待部署完成

Render 会自动：
- 创建 PostgreSQL 数据库（带 pgvector）
- 创建 Redis 缓存
- 部署后端服务
- 配置自动部署

部署完成后，你会获得：
- 后端服务 URL：`https://ai-lowcode-api.onrender.com`
- 数据库连接信息

### 3. 手动部署（可选）

如果不想使用 Blueprint，可以手动创建服务：

#### 创建 PostgreSQL 数据库

1. 点击 **"New"** → **"PostgreSQL"**
2. **Name**：`ai-lowcode-db`
3. **Database**：`ai_lowcode`
4. **User**：`ai_lowcode`
5. **Plan**：Free
6. 点击 **"Create Database"**

#### 创建 Redis

1. 点击 **"New"** → **"Redis"**
2. **Name**：`ai-lowcode-redis`
3. **Plan**：Free
4. 点击 **"Create Redis"**

#### 创建后端服务

1. 点击 **"New"** → **"Web Service"**
2. 选择你的代码仓库
3. **Name**：`ai-lowcode-api`
4. **Root Directory**：`server`
5. **Runtime**：Node
6. **Build Command**：`npm install && npm run build`
7. **Start Command**：`npm run start:prod`
8. **Plan**：Free
9. **Environment Variables**：
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = 从 PostgreSQL 复制
   - `REDIS_URL` = 从 Redis 复制
   - `JWT_SECRET` = 点击 "Generate"
   - `PORT` = `10000`
   - 添加 AI API Key 变量
10. 点击 **"Create Web Service"**

### 4. 数据库初始化

项目包含数据库初始化脚本（`server/init-db/`），会在首次启动时自动执行：
- 安装 pgvector 扩展
- 创建必要的 schema

---

## 项目构建流程

### 本地开发构建

#### 前端构建

```bash
cd web
npm install
npm run build
```

构建输出：`web/dist/`

#### 后端构建

```bash
cd server
npm install
npm run build
```

构建输出：`server/dist/`

### Docker 构建

项目包含完整的 Docker 配置（`server/Dockerfile`）：

```bash
cd server
docker build -t ai-lowcode-platform .
```

### Docker Compose 本地运行

```bash
cd server
docker-compose up -d
```

这会启动：
- PostgreSQL（带 pgvector）
- Redis
- 后端 API

---

## CI/CD 配置

### GitHub Actions 示例

在 `.github/workflows/deploy.yml` 创建：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies and build
        run: |
          cd server
          npm install
          npm run build

      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

### GitLab CI/CD 示例

在 `.gitlab-ci.yml` 创建：

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  image: node:20
  script:
    - cd server
    - npm install
    - npm run build

deploy:
  stage: deploy
  script:
    - echo "Deploy to Render"
  only:
    - main
```

### Render 自动部署

Render 默认启用自动部署：
- 当推送到配置的分支时自动触发
- 使用 `render.yaml` 中的配置

---

## 常见问题排查

### 数据库相关问题

#### 错误：`connection to server at "xxx" failed`

**原因**：数据库连接失败

**解决方案**：
1. 检查 `DATABASE_URL` 格式是否正确
2. 确认数据库服务正在运行
3. 检查网络连接和防火墙设置
4. 验证用户名和密码

#### 错误：`pgvector extension not found`

**原因**：pgvector 扩展未安装

**解决方案**：
1. 使用支持 pgvector 的 PostgreSQL 镜像（如 `pgvector/pgvector:pg18`）
2. 手动执行：`CREATE EXTENSION IF NOT EXISTS vector;`

#### 错误：`schema "public" does not exist`

**原因**：Schema 未创建

**解决方案**：
1. 检查初始化脚本是否执行
2. 手动执行 `server/init-db/` 中的 SQL 文件

### Redis 相关问题

#### 错误：`Redis connection refused`

**原因**：Redis 连接失败

**解决方案**：
1. 检查 `REDIS_URL` 格式是否正确
2. 确认 Redis 服务正在运行
3. 检查 Redis 密码配置

#### 错误：`Redis command timed out`

**原因**：Redis 响应超时

**解决方案**：
1. 检查 Redis 服务性能
2. 增加超时配置
3. 检查网络延迟

### JWT 相关问题

#### 错误：`invalid signature`

**原因**：JWT 签名密钥不匹配

**解决方案**：
1. 确认 `JWT_SECRET` 在所有实例中一致
2. 检查 Token 是否过期
3. 验证 Token 生成和验证逻辑

#### 错误：`jwt expired`

**原因**：Token 已过期

**解决方案**：
1. 使用 Refresh Token 获取新的 Access Token
2. 调整 Token 有效期配置

### AI API 相关问题

#### 错误：`API key invalid`

**原因**：API Key 无效或过期

**解决方案**：
1. 检查 API Key 是否正确配置
2. 确认 API Key 未过期
3. 验证 API Key 权限

#### 错误：`model not found`

**原因**：模型名称不正确

**解决方案**：
1. 确认模型名称拼写正确
2. 检查模型是否可用
3. 参考 AI 服务文档获取正确的模型名称

#### 错误：`rate limit exceeded`

**原因**：API 调用频率超限

**解决方案**：
1. 实现请求队列和重试机制
2. 升级 API 套餐
3. 优化调用频率

### 部署相关问题

#### Render：部署超时

**原因**：构建时间过长

**解决方案**：
1. 优化依赖安装（使用 pnpm）
2. 配置构建缓存
3. 升级到付费计划

#### Render：503 Service Unavailable

**原因**：服务正在启动或已停止

**解决方案**：
1. 等待服务完全启动（Free 计划可能需要 1-2 分钟）
2. 检查服务日志
3. 确认环境变量配置正确

#### Vercel：API 请求失败

**原因**：CORS 或 API URL 配置错误

**解决方案**：
1. 检查 `VITE_API_BASE_URL` 配置
2. 配置后端 CORS 设置
3. 确认后端服务正常运行

### 构建相关问题

#### 错误：`Module not found`

**原因**：依赖未正确安装

**解决方案**：
1. 删除 `node_modules` 和 lock 文件
2. 重新安装依赖
3. 检查 `package.json` 配置

#### 错误：`TypeScript compilation failed`

**原因**：TypeScript 类型错误

**解决方案**：
1. 运行 `npm run typecheck` 查看详细错误
2. 修复类型错误
3. 检查 TypeScript 配置

---

## 获取帮助

如遇到其他问题，请：
1. 查看服务日志
2. 检查环境变量配置
3. 参考各平台官方文档

---

**文档版本**：1.0.0  
**最后更新**：2026-04-30
