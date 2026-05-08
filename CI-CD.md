# CI/CD 配置指南

本项目已配置 GitHub Actions CI/CD 工作流。

---

## 📋 目录

- [CI 工作流](#ci-工作流)
- [CD 工作流](#cd-工作流)
- [提交规范](#提交规范)
- [本地开发](#本地开发)
- [部署指南](#部署指南)

---

## 📝 提交规范

参考 [CONTRIBUTING.md](./CONTRIBUTING.md)：

- 分支: `main` (生产), `dev` (开发)
- 提交格式: `type(scope): description`
- 类型: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## 🚀 CI 工作流

**文件位置: `.github/workflows/ci.yml`

### 触发条件
- 推送到 `main` 或 `develop` 分支
- 创建拉取请求

### CI 任务

1. **Lint** - 检查代码规范
2. **Build** - 构建项目
3. **Test** - 运行测试

---

## 📦 CD 工作流

**文件位置**: `.github/workflows/cd.yml`

### 触发条件
- 推送到 `main` 分支
- 推送 `v*` 标签 (例如 `v1.0.0`)

### CD 任务
- 构建 Docker 镜像
- 推送到 GitHub Container Registry

---

## 🔧 使用指南

### 1. 确保 pnpm-lock.yaml

确保 `server/` 和 `web/` 目录下都有 `pnpm-lock.yaml`（项目已有）：

### 2. 推送代码到 GitHub

```bash
git add .
git commit -m "feat: add ci/cd configuration"
git push
```

### 3. 查看 CI/CD 状态

打开 GitHub 仓库页面，点击 **Actions** 标签页查看工作流运行状态。

---

## 🐳 Docker 部署

### 拉取镜像

```bash
docker pull ghcr.io/[你的用户名]/[仓库名]/server:latest
docker pull ghcr.io/[你的用户名]/[仓库名]/web:latest
```

### 运行完整部署

使用 `docker-compose.yml` 已经配置好，直接运行：

```bash
docker-compose up -d
```

---

## 📝 注意事项

1. **环境变量** - 使用 GitHub Secrets 管理敏感信息
2. **权限** - 确保 GitHub Actions 有 Packages 写权限
3. **Dockerfile** - 项目已有 Dockerfile，无需修改
