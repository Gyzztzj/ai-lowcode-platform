
# AI 低代码平台 - 项目部署与技术文档

## 目录

- [第一部分：部署指南](#第一部分部署指南)
  - [1. 前端部署（Vercel平台）](#1-前端部署vercel平台)
  - [2. 服务端部署（Railway平台）](#2-服务端部署railway平台)
  - [3. 数据库部署（Railway平台）](#3-数据库部署railway平台)
  - [4. 部署后验证](#4-部署后验证)
- [第二部分：技术点文档](#第二部分技术点文档)
  - [1. 项目架构概述](#1-项目架构概述)
  - [2. 核心技术点解析](#2-核心技术点解析)
  - [3. 难点问题解决方案](#3-难点问题解决方案)
  - [4. 性能优化策略](#4-性能优化策略)
  - [5. 安全措施实现](#5-安全措施实现)
  - [6. 可扩展性设计](#6-可扩展性设计)

---

## 第一部分：部署指南

### 1. 前端部署（Vercel平台）

#### 1.1 Vercel 账户准备

1. 访问 [Vercel 官网](https://vercel.com) 并注册/登录账户
2. 建议使用 GitHub 账户关联，方便后续项目导入
3. 完成账户基本设置（邮箱验证等）

#### 1.2 项目连接

1. 在 Vercel 控制台点击 "Add New" → "Project"
2. 选择 GitHub/GitLab/Bitbucket 仓库中的 `ai-lowcode-platform` 项目
3. 点击 "Import" 导入项目

#### 1.3 环境变量配置

在项目设置中配置以下环境变量：

```env
# API 地址（根据服务端部署地址配置）
VITE_API_URL=https://your-railway-api.railway.app
```

#### 1.4 构建命令设置

Vercel 通常会自动检测 Vite 项目，但确保以下配置正确：

- **Root Directory**: `web` （前端代码所在目录）
- **Framework Preset**: `Vite`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`

#### 1.5 部署流程

1. 完成上述配置后点击 "Deploy"
2. 等待构建完成（通常 1-3 分钟）
3. 部署成功后会获得一个 `*.vercel.app` 域名
4. 可以在项目设置中绑定自定义域名

#### 1.6 常见问题解决方案

| 问题 | 解决方案 |
|------|----------|
| 构建失败，提示依赖安装错误 | 检查 `package.json` 中的依赖版本，确保 Node 版本兼容（推荐 Node 20+） |
| API 请求失败 | 检查 `VITE_API_URL` 是否配置正确，确保服务端已部署并正常运行 |
| 路由刷新 404 | 在 `vercel.json` 中配置重写规则，将所有请求重定向到 `index.html` |

**示例 vercel.json 配置：**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### 2. 服务端部署（Railway平台）

#### 2.1 Railway 项目创建

1. 访问 [Railway 官网](https://railway.app) 并注册/登录账户
2. 点击 "New Project" → "Deploy from repo"
3. 选择 GitHub 仓库中的 `ai-lowcode-platform` 项目
4. 配置部署根目录为 `server`

#### 2.2 服务配置

在 Railway 项目设置中配置：

**Build Command：**
```bash
pnpm install && pnpm build
```

**Start Command：**
```bash
pnpm start:prod
```

#### 2.3 环境变量配置

配置以下必需的环境变量：

```env
# 服务端基础配置
PORT=3000
NODE_ENV=production

# 数据库连接（后续配置）
DATABASE_URL=postgresql://user:password@host:port/database

# Redis 连接（可选，用于限流和缓存）
REDIS_URL=redis://redis-host:6379

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 允许的跨域源
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com

# AI 模型配置（根据实际使用的模型服务提供商配置）
OPENAI_API_KEY=your-openai-api-key
DOUBAO_API_KEY=your-doubao-api-key
```

#### 2.4 资源分配

- 默认配置通常足够，如需要可根据实际使用情况调整：
  - **Memory**: 至少 512MB（推荐 1GB+）
  - **CPU**: 按需分配
  - **Disk**: 默认即可

#### 2.5 部署验证

1. 等待部署完成（通常 3-5 分钟）
2. 访问 `https://your-railway-api.railway.app/api` 验证服务运行
3. 访问 `https://your-railway-api.railway.app/api/docs` 查看 Swagger API 文档

---

### 3. 数据库部署（Railway平台）

#### 3.1 数据库创建

1. 在 Railway 项目中点击 "New" → "Database"
2. 选择 "PostgreSQL"
3. 等待数据库创建完成

#### 3.2 连接配置

1. 数据库创建后，Railway 会自动生成 `DATABASE_URL` 环境变量
2. 确保使用 `pgvector/pgvector` 镜像（支持向量存储）
3. 在 Railway 中可以通过 Variables 页面查看连接详情

**手动配置 pgvector 扩展：**

如果 Railway 没有自动启用 pgvector，需要在部署后手动执行：

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

#### 3.3 数据迁移

项目使用 TypeORM 进行数据库管理，部署后会自动执行：

1. **自动同步**（生产环境建议禁用）：
   - 在 `database.module.ts` 中配置 `synchronize: true`（仅用于开发）

2. **手动迁移**（推荐生产使用）：
   - 生成迁移：`pnpm run migration:generate --name=Init`
   - 执行迁移：`pnpm run migration:run`

#### 3.4 备份策略

Railway 提供自动备份功能：

1. 在数据库服务页面点击 "Backups"
2. 配置备份频率（建议每日备份）
3. 保留最近 7-30 天的备份
4. 可以手动创建备份点

#### 3.5 安全设置

1. 限制数据库访问 IP（Railway 默认只允许项目内访问）
2. 使用强密码
3. 定期轮换数据库凭证
4. 启用 SSL 连接

---

### 4. 部署后验证

#### 4.1 前端访问测试

1. 在浏览器中访问 Vercel 分配的域名
2. 验证页面正常加载
3. 测试导航功能是否正常

#### 4.2 API 接口测试

1. 访问 `/api/docs` 查看 Swagger 文档
2. 使用 Swagger UI 测试各个接口：
   - 注册/登录接口
   - 创建应用
   - 知识库操作
   - AI 对话

#### 4.3 数据库连接测试

1. 使用 Railway 提供的数据库连接信息
2. 使用数据库管理工具（如 DBeaver、pgAdmin）连接验证
3. 检查表是否正确创建
4. 验证 pgvector 扩展是否启用

#### 4.4 整体功能验证

完整测试流程：

1. 用户注册/登录
2. 创建新应用
3. 配置工作流
4. 创建知识库并上传文档
5. 进行 AI 对话
6. 测试 OpenAI 兼容 API
7. 验证审计日志和 Token 用量统计

---

## 第二部分：技术点文档

### 1. 项目架构概述

#### 1.1 前后端分离模式

项目采用标准的前后端分离架构：

```
┌─────────────┐         HTTP/REST API         ┌─────────────┐
│   前端 (Web)│ ◄───────────────────────────► │  服务端 API │
│  React + Vite│                               │   NestJS    │
└─────────────┘                               └─────────────┘
       │                                               │
       │                                               │
       ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│  状态管理       │                           │   PostgreSQL    │
│  Zustand        │                           │   + pgvector    │
└─────────────────┘                           └─────────────────┘
                                               │
                                               ▼
                                          ┌─────────┐
                                          │  Redis  │
                                          │  (缓存) │
                                          └─────────┘
```

#### 1.2 核心技术栈

**前端技术栈：**
- React 19 + TypeScript
- Vite（构建工具）
- React Router（路由）
- Zustand（状态管理）
- React Flow（工作流可视化）
- Tailwind CSS + shadcn/ui（UI 组件库）
- TanStack Query（数据请求）

**后端技术栈：**
- NestJS（Node.js 框架）
- TypeScript
- TypeORM（ORM）
- PostgreSQL + pgvector（数据库）
- Redis（缓存/限流）
- JWT（认证）
- Swagger（API 文档）
- LangChain（AI 集成）

#### 1.3 模块组成

**后端主要模块：**

| 模块 | 功能 |
|------|------|
| Auth | 用户认证、注册登录、JWT 管理 |
| Apps | 应用管理、工作流配置 |
| Knowledge | 知识库管理、文档处理、向量存储 |
| Conversations | 对话管理、消息存储 |
| AI | AI 能力集成、LLM 调用 |
| RAG | 检索增强生成 |
| Flow | 工作流执行引擎 |
| ApiKeys | API 密钥管理 |
| OpenAI | OpenAI 兼容 API |
| RateLimit | 请求限流 |
| Audit | 审计日志 |

---

### 2. 核心技术点解析

#### 2.1 工作流引擎设计

**工作流节点类型：**
- Start（开始节点）
- End（结束节点）
- UserInput（用户输入）
- SystemPrompt（系统提示词）
- LLM（大语言模型）
- KnowledgeBase（知识库检索）
- Condition（条件判断）
- VariableSet（变量设置）

**执行器模式（Executor Pattern）：**

```typescript
// 执行器基类
abstract class BaseExecutor {
  abstract execute(context: FlowContext): Promise&lt;FlowContext&gt;;
}

// 工厂创建执行器
class ExecutorFactory {
  static createExecutor(nodeType: NodeType): BaseExecutor {
    switch (nodeType) {
      case NodeType.LLM:
        return new LlmExecutor();
      case NodeType.KNOWLEDGE_BASE:
        return new KnowledgeBaseExecutor();
      // ...
    }
  }
}
```

**优势：**
- 符合开闭原则，新增节点类型只需添加新执行器
- 每个执行器职责单一，易于测试和维护
- 支持异步执行和错误处理

#### 2.2 RAG（检索增强生成）实现

**RAG 架构层次：**

```
┌─────────────────────────────────────────────────┐
│           RAG Orchestrator Service              │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │   文本分块   │───►│   向量化存储         │  │
│  │ Text Splitter│    │  Multi-Embedding     │  │
│  └──────────────┘    └──────────────────────┘  │
│         │                     │                 │
│         ▼                     ▼                 │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │   检索聚合   │    │   重排序 (Rerank)    │  │
│  │   Retrieval  │    │                      │  │
│  └──────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**核心技术：**
- 使用 LangChain 进行文本分块
- pgvector 存储向量嵌入
- 余弦相似度检索
- 支持多模型嵌入

#### 2.3 React Flow 工作流可视化

**前端实现关键点：**

```typescript
// 自定义节点组件
const BaseNode = ({ data, selected }: NodeProps) =&gt; {
  return (
    &lt;div className={`... ${selected ? 'ring-2 ring-primary' : ''}`}&gt;
      &lt;Handle type="target" position={Position.Top} /&gt;
      &lt;div className="..."&gt;{data.label}&lt;/div&gt;
      &lt;Handle type="source" position={Position.Bottom} /&gt;
    &lt;/div&gt;
  );
};
```

**功能特性：**
- 节点拖拽
- 节点连线
- 右键上下文菜单
- 节点属性编辑
- 工作流验证

#### 2.4 TypeORM 实体设计

**实体关系图：**

```
User (1) ────&lt; (n) App
                │
                ├─&lt; (n) Conversation ──&lt; (n) Message
                │
                └─ (1) ──&gt; KnowledgeBase (1) ──&lt; (n) Document
                                                     │
                                                     └─&lt; (n) Chunk (with vector)
```

**向量字段支持：**

```typescript
@Entity()
export class Chunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'vector',
    length: 1536, // OpenAI embedding 维度
  })
  vector: number[];
}
```

---

### 3. 难点问题解决方案

#### 3.1 问题：大文件上传处理

**挑战：**
- PDF、Word 等大文件上传
- 文件解析和向量化耗时较长

**解决方案：**

1. **分块上传 + 进度反馈**
2. **异步处理 + 状态轮询**

```typescript
// 异步处理文档
@Post('upload')
async uploadDocument(@UploadedFile() file: Express.Multer.File) {
  const doc = await this.knowledgeService.createDocument(file);
  // 立即返回，后台异步处理
  this.knowledgeService.processDocumentAsync(doc.id);
  return doc;
}

// 状态查询
@Get('documents/:id/status')
async getDocumentStatus(@Param('id') id: string) {
  return this.knowledgeService.getDocumentStatus(id);
}
```

#### 3.2 问题：向量检索性能优化

**挑战：**
- 知识库文档增多时，向量检索变慢
- 需要支持高效的相似度搜索

**解决方案：**

1. **使用 pgvector 的 HNSW 索引**

```sql
CREATE INDEX ON "Chunk" USING hnsw (vector vector_cosine_ops);
```

2. **分块策略优化**
   - 自适应分块大小
   - 语义边界检测

3. **结果缓存**
   - 使用 Redis 缓存常用查询结果

#### 3.3 问题：工作流执行状态管理

**挑战：**
- 工作流可能包含多个异步步骤
- 需要跟踪执行状态和中间结果
- 支持暂停/恢复和错误重试

**解决方案：**

1. **工作流会话实体**

```typescript
@Entity()
export class WorkflowSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  context: Record&lt;string, any&gt;;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.PENDING,
  })
  status: WorkflowStatus;

  @Column('jsonb', { nullable: true })
  error?: any;
}
```

2. **状态机模式管理执行流程**

---

### 4. 性能优化策略

#### 4.1 前端加载优化

1. **代码分割（Code Splitting）**
   - 路由级别的懒加载
   - 组件级别的动态导入

2. **资源预加载**
   - 使用 Vite 的预构建功能
   - 关键资源预加载

3. **图片优化**
   - 使用合适的图片格式
   - 懒加载非关键图片

#### 4.2 API 响应优化

1. **数据库查询优化**
   - 使用 QueryBuilder 构建高效查询
   - 避免 N+1 查询问题
   - 添加合适的索引

2. **Redis 缓存**
   - 缓存用户会话
   - 缓存知识库检索结果
   - 缓存 API 响应

```typescript
@Injectable()
export class CacheService {
  async get&lt;T&gt;(key: string): Promise&lt;T | null&gt; {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }
}
```

3. **响应压缩**
   - 启用 Gzip 压缩
   - 流式传输大响应

#### 4.3 数据库查询优化

1. **索引优化**
   - 为常用查询字段添加索引
   - 复合索引优化多字段查询

2. **查询分页**
   - 所有列表接口支持分页
   - 使用游标分页替代偏移分页（大数据量场景）

3. **连接池配置**

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  // ...
  extra: {
    max: 20, // 最大连接数
    idleTimeoutMillis: 30000,
  },
}),
```

---

### 5. 安全措施实现

#### 5.1 身份认证与授权

1. **JWT 认证**

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

2. **角色权限控制**

```typescript
@SetMetadata('roles', [Role.ADMIN])
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete('users/:id')
async deleteUser(@Param('id') id: string) {
  // 仅管理员可访问
}
```

3. **API 密钥认证**（用于 OpenAI 兼容 API）

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise&lt;boolean&gt; {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    // 验证 API 密钥
    return this.validateApiKey(apiKey);
  }
}
```

#### 5.2 数据加密

1. **密码加密（bcrypt）**

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

2. **敏感信息加密存储**
   - API 密钥使用加密存储
   - 数据库连接信息通过环境变量配置

#### 5.3 请求安全

1. **CORS 配置**

```typescript
app.enableCors({
  origin: (origin, callback) =&gt; {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

2. **请求限流（Rate Limiting）**

```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise&lt;boolean&gt; {
    const key = this.getKey(context);
    const requests = await this.redis.incr(key);
    if (requests === 1) {
      await this.redis.expire(key, 60); // 1分钟窗口
    }
    return requests &lt;= 100; // 每分钟最多100次请求
  }
}
```

3. **输入验证**
   - 使用 class-validator 验证 DTO
   - 全局验证管道过滤未知字段

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

#### 5.4 审计日志

记录所有关键操作：

```typescript
@Injectable()
export class AuditService {
  async log(action: string, userId: string, details?: any) {
    await this.auditLogRepository.save({
      action,
      userId,
      details,
      timestamp: new Date(),
    });
  }
}
```

---

### 6. 可扩展性设计

#### 6.1 模块化架构

项目采用 NestJS 模块化设计，每个功能模块独立：

```
src/
├── auth/              # 认证模块
├── apps/              # 应用模块
├── knowledge/         # 知识库模块
├── ai/                # AI 模块
├── rag/               # RAG 模块
├── flow/              # 工作流模块
└── ...
```

**优势：**
- 模块可独立开发和测试
- 便于功能扩展
- 支持微服务化演进

#### 6.2 接口设计规范

**RESTful API 设计原则：**

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/apps | 获取应用列表 |
| GET | /api/apps/:id | 获取单个应用 |
| POST | /api/apps | 创建应用 |
| PUT | /api/apps/:id | 更新应用 |
| DELETE | /api/apps/:id | 删除应用 |

**统一响应格式：**

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

#### 6.3 插件化扩展点

1. **自定义 AI 模型提供商**

```typescript
interface LLMProvider {
  generate(prompt: string, options: LLMOptions): Promise&lt;string&gt;;
  embed(text: string): Promise&lt;number[]&gt;;
}

class OpenAIProvider implements LLMProvider { /* ... */ }
class DoubaoProvider implements LLMProvider { /* ... */ }
```

2. **自定义文档解析器**

```typescript
interface DocumentParser {
  supports(fileType: string): boolean;
  parse(file: Buffer): Promise&lt;string&gt;;
}

class PdfParser implements DocumentParser { /* ... */ }
class WordParser implements DocumentParser { /* ... */ }
```

#### 6.4 未来扩展方向

1. **多租户支持**
   - 增加组织/团队概念
   - 数据隔离和权限管理

2. **工作流市场**
   - 分享和发现工作流模板
   - 工作流版本管理

3. **更多 AI 能力集成**
   - 图像生成
   - 语音识别/合成
   - 多模态理解

4. **数据分析面板**
   - 使用统计
   - Token 消耗分析
   - 性能监控

5. **自动化测试**
   - 工作流单元测试
   - 端到端测试
   - 性能基准测试

---

## 总结

本文档详细介绍了 AI 低代码平台的部署流程和技术架构。通过本文档，开发者可以：

1. 顺利完成项目在 Vercel 和 Railway 上的部署
2. 深入理解项目的技术选型和架构设计
3. 掌握核心功能的实现原理
4. 了解性能优化和安全措施
5. 为项目的后续扩展提供参考

该项目展示了现代全栈开发的最佳实践，包括 TypeScript 的全面应用、前后端分离架构、AI 能力集成、RAG 实现等，非常适合作为技术面试的项目案例。
