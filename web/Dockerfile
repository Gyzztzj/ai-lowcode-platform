# 构建阶段
FROM node:22-alpine AS builder

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

# 构建（不需要构建参数，我们用运行时注入）
RUN pnpm build

# 生产阶段 - 使用 nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（处理前端路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制环境变量注入脚本
COPY env.sh /usr/share/nginx/html/env.sh
RUN chmod +x /usr/share/nginx/html/env.sh

EXPOSE 80

# 使用脚本启动，先注入环境变量再启动 nginx
CMD ["/usr/share/nginx/html/env.sh"]
