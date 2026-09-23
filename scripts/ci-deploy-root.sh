#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
PATH=/usr/sbin:/usr/bin:/sbin:/bin

CONTAINER=aitool
IMAGE_PREFIX=ghcr.io/owenshen0907/aitool
ROLLBACK_TAG=aitool-rollback:previous
ENV_FILE=/home/AiTool/.env.local
CONTENT_DIR=/home/AiTool-content
STATE_DIR=/var/lib/aitool-release
docker_config_dir=''

cleanup() {
  if [ -n "$docker_config_dir" ] && [ -d "$docker_config_dir" ]; then
    rm -f "$docker_config_dir/config.json"
    rmdir "$docker_config_dir"
  fi
}
trap cleanup EXIT

health_check() {
  local attempt
  for attempt in $(seq 1 30); do
    if curl --fail --silent --show-error --max-time 3 \
      http://127.0.0.1:3000/ > /dev/null 2>&1 &&
      curl --fail --silent --show-error --max-time 3 \
      http://127.0.0.1:3000/notes > /dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

restore_previous() {
  local backup_name="$1"
  docker rm -f "$CONTAINER" > /dev/null 2>&1 || true
  if [ -n "$backup_name" ]; then
    docker rename "$backup_name" "$CONTAINER"
    docker start "$CONTAINER" > /dev/null
  fi
}

cutover() {
  local image="$1"
  local desired_id old_id backup_name
  desired_id=$(docker image inspect --format '{{.Id}}' "$image")
  old_id=''
  backup_name=''

  if docker inspect "$CONTAINER" > /dev/null 2>&1; then
    old_id=$(docker inspect --format '{{.Image}}' "$CONTAINER")
    if [ "$old_id" = "$desired_id" ]; then
      echo "AiTool already runs image $desired_id"
      health_check
      return
    fi
    docker tag "$old_id" "$ROLLBACK_TAG"
    backup_name="aitool-before-$(date +%s)-$$"
    docker stop "$CONTAINER" > /dev/null
    if ! docker rename "$CONTAINER" "$backup_name"; then
      docker start "$CONTAINER" > /dev/null
      return 1
    fi
  fi

  if ! docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    --security-opt no-new-privileges \
    --publish 127.0.0.1:3000:3000 \
    --env-file "$ENV_FILE" \
    --env APP_URL=https://owenshen.top \
    --mount "type=bind,source=$CONTENT_DIR,target=/AiTool-content,readonly" \
    "$desired_id" > /dev/null; then
    restore_previous "$backup_name"
    return 1
  fi

  if ! health_check; then
    echo "AiTool health check failed; restoring the previous container." >&2
    restore_previous "$backup_name"
    return 1
  fi

  if [ -n "$backup_name" ]; then
    docker rm "$backup_name" > /dev/null ||
      echo "Warning: old stopped container $backup_name needs cleanup." >&2
  fi
  printf '%s\n' "$desired_id" > "$STATE_DIR/current-image"
  printf '%s\n' "$old_id" > "$STATE_DIR/previous-image"
  echo "AiTool is healthy on image $desired_id"
}

if [ "$#" -lt 1 ]; then
  echo "Expected deploy <sha> <digest> <github-actor> or rollback." >&2
  exit 2
fi

mkdir -p "$STATE_DIR"
exec 9>"$STATE_DIR/lock"
flock -x 9

if [ ! -f "$ENV_FILE" ] || [ ! -d "$CONTENT_DIR/posts" ]; then
  echo "The existing production env file or content mount is missing." >&2
  exit 1
fi

case "$1" in
  deploy)
    actor_pattern='^[a-zA-Z0-9_-]+(\[bot\])?$'
    if [ "$#" -ne 4 ] ||
      [[ ! "$2" =~ ^[0-9a-f]{40}$ ]] ||
      [[ ! "$3" =~ ^sha256:[0-9a-f]{64}$ ]] ||
      [[ ! "$4" =~ $actor_pattern ]] ||
      [ "${#4}" -gt 64 ]; then
      echo "Deployment requires an exact commit SHA, image digest and GitHub actor." >&2
      exit 2
    fi
    IFS= read -r registry_token
    if [ -z "$registry_token" ]; then
      echo "An ephemeral registry token is required." >&2
      exit 1
    fi
    docker_config_dir=$(mktemp -d /run/aitool-docker.XXXXXX)
    printf '%s' "$registry_token" |
      DOCKER_CONFIG="$docker_config_dir" docker login ghcr.io \
        -u "$4" --password-stdin > /dev/null
    unset registry_token
    image="$IMAGE_PREFIX@$3"
    DOCKER_CONFIG="$docker_config_dir" docker pull "$image"
    revision=$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")
    if [ "$revision" != "$2" ]; then
      echo "The pulled image revision does not match the approved commit." >&2
      exit 1
    fi
    cutover "$image"
    printf '%s\n' "$2" > "$STATE_DIR/current-sha"
    ;;
  rollback)
    if [ "$#" -ne 1 ] || ! docker image inspect "$ROLLBACK_TAG" > /dev/null 2>&1; then
      echo "No previous AiTool image is available for rollback." >&2
      exit 1
    fi
    rollback_revision=$(docker image inspect --format \
      '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$ROLLBACK_TAG")
    if [[ ! "$rollback_revision" =~ ^[0-9a-f]{40}$ ]]; then
      rollback_revision=unknown
    fi
    cutover "$ROLLBACK_TAG"
    printf '%s\n' "$rollback_revision" > "$STATE_DIR/current-sha"
    echo "Rolled back AiTool to the previous image."
    ;;
  *)
    echo "Expected deploy <sha> <digest> <github-actor> or rollback." >&2
    exit 2
    ;;
esac
