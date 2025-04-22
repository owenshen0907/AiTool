#!/bin/bash

set -e

PROJECT_NAME="nihongo"

echo "🛑 停止容器..."
docker stop $PROJECT_NAME || true

echo "📥 拉取最新代码..."
git pull

echo "🔁 使用 docker-compose 重建容器..."
docker-compose up -d --build

echo "✅ 快速更新完成，服务已重启。"