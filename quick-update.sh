#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="aitool"             # docker-compose -p <PROJECT>
TAG="${1:-latest}"           # ./quick-deploy.sh v1.2.3 → 传递 tag
COMPOSE="docker-compose.yml"

log() { printf '\e[32m%s\e[0m\n' "$*"; }
trap 'log "❌ 失败，退出码 $?"' ERR

# ---------- Git pull（兼容旧版本，没有 --autostash） -----------------------
log "📥  git pull（带手动 stash，兼容旧 Git）"

NEED_STASH=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  NEED_STASH=1
  STASH_REF=$(git stash push -u -m "auto-stash $(date +%F_%T)")
  log "  - 已 stash 本地改动：$STASH_REF"
fi

# --ff-only：若本地分支有额外提交会失败，符合生产场景；可改成 --rebase
git pull --ff-only

if [[ $NEED_STASH == 1 ]]; then
  git stash pop --quiet || log "  - 没有需要恢复的改动"
fi
# ---------------------------------------------------------------------------

log "🔨  docker compose build（有变化会重建镜像）"
docker compose -p "$PROJECT" -f "$COMPOSE" build

log "🛑  docker compose down（停止旧容器）"
docker compose -p "$PROJECT" -f "$COMPOSE" down

log "🚀  docker compose up -d --build --no-deps（热启 tag=$TAG）"
docker compose -p "$PROJECT" -f "$COMPOSE" up -d --build --no-deps

log "✅  更新完毕！"