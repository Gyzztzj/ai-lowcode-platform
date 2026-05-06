# 本地 Docker 部署说明

## 这个文件有什么用？

这个 `docker-compose.yml` 可以灵活启动不同的服务组合，根据你的需求选择。

---

## 前置条件

1. 电脑上安装了 Docker 和 Docker Compose
2. 有 OpenAI 或豆包的 API Key

---

## 第一步：配置环境变量（重要！）

1. 复制 `env.docker.example` 为 `.env.docker`：
   ```bash
   cp .env.docker.example .env.docker
   ```
   （Windows 用户直接复制重命名）

2. 打开 `.env.docker`，填入你的配置：
   - 把 `OPENAI_API_KEY` 或 `DOUBAO_API_KEY` 改成你真实的 Key
   - （可选）把 `JWT_SECRET` 改成强密码
   - 其他配置可以保持默认

---

## 几种使用方式（按需选择）

### 方式一：平时开发（推荐）

**只启动数据库和 Redis，前端后端本地跑（有热更新）**

```bash
docker-compose up -d postgres redis
```

然后：
- 后端本地开发：`cd server && pnpm install && pnpm dev`
- 前端本地开发：`cd web && pnpm install && pnpm dev`

| 服务 | 地址 |
|------|------|
| 数据库 | localhost:5432 |
| Redis | localhost:6379 |
| 后端（本地） | http://localhost:3000 |
| 前端（本地） | http://localhost:5173 |

---

### 方式二：一键启动所有服务（演示/快速体验）

**启动前后端+数据库+Redis，一条命令搞定**

```bash
docker-compose up -d
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3001 |
| 后端 | http://localhost:3000 |
| 数据库 | localhost:5432 |
| Redis | localhost:6379 |

---

### 方式三：只启动后端服务（测试后端用）

```bash
docker-compose up -d postgres redis server
```

---

## 常用命令

| 命令 | 作用 |
|------|------|
| `docker-compose up -d postgres redis` | 只启动数据库和 Redis |
| `docker-compose up -d` | 启动所有服务（后台运行） |
| `docker-compose up -d --build [服务名]` | 重新构建并启动指定服务（如：`web` 或 `server`） |
| `docker-compose logs -f` | 查看实时日志 |
| `docker-compose logs -f [服务名]` | 只看某个服务的日志（如：`server`） |
| `docker-compose down` | 停止并删除所有服务（数据保留） |
| `docker-compose down -v` | 停止并删除所有服务和数据（慎用） |
| `docker-compose restart` | 重启所有服务 |
| `docker-compose restart [服务名]` | 只重启某个服务 |

---

## 其他说明

### 数据库数据

数据库数据会持久化保存，即使你 `docker-compose down` 了，数据也不会丢。

### 只修改了代码，想重新构建

如果只修改了前端或后端代码，执行：

```bash
# 只重新构建前端
docker-compose up -d --build web

# 只重新构建后端
docker-compose up -d --build server

# 重新构建所有
docker-compose up -d --build
```

---

## 我的推荐

- **平时开发：** 用方式一，只启动数据库和 Redis，代码本地跑（有热更新）
- **演示给别人看：** 用方式二，一键启动所有服务
- **只测试后端：** 用方式三

---

## 注意事项

- 记得在 `docker-compose.yml` 里填上你的 API Key
- 这个是本地开发环境，不要直接用在生产环境
- 生产环境建议还是用 Railway 或其他云平台
