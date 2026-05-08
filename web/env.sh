#!/bin/sh

# 从环境变量中读取 VITE_API_URL，替换到前端文件中
if [ -n "$VITE_API_URL" ]; then
  echo "Injecting VITE_API_URL: $VITE_API_URL"
  
  # 替换 index.html 中的占位符
  sed -i "s|VITE_API_URL_PLACEHOLDER|$VITE_API_URL|g" /usr/share/nginx/html/index.html
fi

# 启动 nginx
exec nginx -g "daemon off;"
