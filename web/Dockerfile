# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 配置国内镜像（可选）
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm
RUN npm install -g pnpm@9

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 接收构建参数并设置为环境变量
# 注意：Vite 环境变量必须以 VITE_ 开头，且构建时就确定
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 构建
RUN pnpm build

# 生产阶段 - 使用 nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（处理前端路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
