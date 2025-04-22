#!/bin/bash

set -e

PROJECT_NAME="nihongo"
IMAGE_NAME="nihongo-runtime"

echo "🛑 停止旧容器..."
docker stop $PROJECT_NAME || true

echo "🗑️ 删除旧容器..."
docker rm $PROJECT_NAME || true

echo "🔥 删除旧镜像..."
docker rmi $IMAGE_NAME || true

echo "📥 拉取最新代码..."
git pull

echo "🔨 重新构建镜像（Dockerfile）..."
docker build --no-cache -t $IMAGE_NAME .

echo "🔁 使用 docker-compose 构建服务..."
docker-compose build --no-cache

echo "🚀 启动服务..."
docker-compose up -d

echo "✅ 完整更新完成，服务已重启。"