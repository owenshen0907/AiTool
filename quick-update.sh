#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="aitool"
TAG="${1:-latest}"                 # ./quick-deploy.sh v1.2.3
COMPOSE="docker-compose.yml"

log() { printf '\e[32m%s\e[0m\n' "$*"; }
trap 'log "❌ 失败，退出码 $?"' ERR

log "📥  git pull"
git pull --rebase --autostash

log "🔨  build 改动服务…"
docker compose -p "$PROJECT" -f "$COMPOSE" build

log "🛑  停旧容器（如果已运行）…"
docker compose -p "$PROJECT" -f "$COMPOSE" down

log "🚀  以 tag=${TAG} 热启…"
# 如果你在 compose.yml 里 image: aitool-runtime:${TAG}
# 这里就可以带 --build，同步更新 tag
docker compose -p "$PROJECT" -f "$COMPOSE" up -d --no-deps --build

log "✅  更新完毕！"