# ====================== 构建阶段 ======================
FROM node:22-alpine AS builder
WORKDIR /app

# 1. 只配置 npm 国内 registry 镜像（解决装 pnpm 慢）
RUN npm config set registry https://registry.npmmirror.com

# 2. 安装 pnpm（现在从国内镜像拉取，秒装）
RUN npm install -g pnpm@9

# 3. 配置 pnpm 国内镜像（解决项目依赖下载慢）
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm config set allow-scripts true

# 利用缓存：先复制依赖文件，再安装
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN pnpm build

# ====================== 生产阶段 ======================
FROM node:22-alpine AS production
WORKDIR /app

# 同样配置 npm 镜像，再装 pnpm
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm@9

# 配置 pnpm 镜像
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm config set allow-scripts true

# 安装生产依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# 复制构建产物
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]