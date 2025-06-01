#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# deploy.sh – one-shot 部署 / 升级脚本
# 要求：
#   • 已安装 docker / docker-compose
#   • 运行用户可直接执行 docker 命令（或加 sudo）
# ---------------------------------------------------------------------------

set -Eeuo pipefail

# === 可调参数 ===============================================================
PROJECT_NAME="aitool"          # 容器名 / docker-compose project
IMAGE_NAME="aitool-runtime"    # Dockerfile 构建出的镜像名
TAG="${1:-latest}"             # 允许 ./deploy.sh v1.2.3 指定 tag；默认为 latest
COMPOSE_FILE="docker-compose.yml"
BUILD_ARGS=()                  # 比如 "--build-arg NODE_ENV=production"
# ===========================================================================

main() {
  log "🔄  拉取最新代码…"
  git pull --rebase --autostash || true

  log "🛑  关闭旧容器…"
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down || true

  log "🧹  清理旧镜像（同名同 tag）…"
  docker image rm "${IMAGE_NAME}:${TAG}" 2>/dev/null || true

  log "🔨  重新 build 镜像…"
  docker build \
    --pull \                       # 每次拉最新基础镜像
    --no-cache \
    -t "${IMAGE_NAME}:${TAG}" \
    "${BUILD_ARGS[@]}" \
    .

  log "🚀  启动/滚动更新服务…"
  docker compose \
    -p "$PROJECT_NAME" \
    -f "$COMPOSE_FILE" \
    up -d --no-deps --build          # 只重建改动过的 service

  log "✅  Done! 服务已就绪 👉  http(s)://<你的域名>"
}

# === 小工具 ================================================================
log() { printf '\e[32m%s\e[0m\n' "$*"; }
trap 'log "❌  出错，退出码 $?"' ERR
main "$@"