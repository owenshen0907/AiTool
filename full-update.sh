#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="aitool"          # compose project name
IMAGE="aitool-runtime"    # Dockerfile 生成的镜像 tag
COMPOSE_FILE="docker-compose.yml"

log(){ printf '\e[32m%s\e[0m\n' "$*"; }

##############################################################################
# 1. 拉代码 —— 兼容低版本 Git（无 autostash）
##############################################################################
log "📥  git pull (with manual stash)…"
if ! git diff --quiet; then
  git stash push -m "auto-stash-before-update"
  STASHED=1
fi
git pull --rebase
[[ ${STASHED:-0} == 1 ]] && git stash pop || true

##############################################################################
# 2. 停 & 删旧容器（不会删镜像层，重建快）
##############################################################################
log "🛑  docker compose down…"
docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down

##############################################################################
# 3. Build 镜像（这里一定要把 build context 指向当前目录 . ）
##############################################################################
log "🔨  docker build --no-cache -t $IMAGE ."
docker build --no-cache -t "$IMAGE" .   # 注意最后的 DOT ！

##############################################################################
# 4. 启动新容器
##############################################################################
log "🚀  docker compose up -d"
docker compose -p "$PROJECT" -f "$COMPOSE_FILE" up -d --build

log "✅  完整更新完成！"