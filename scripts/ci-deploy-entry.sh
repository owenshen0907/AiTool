#!/usr/bin/env bash
set -euo pipefail

# Install as a root-owned file and pin it with a forced command in the
# web-deploy SSH key's authorized_keys entry.
PATH=/usr/sbin:/usr/bin:/sbin:/bin
request="${SSH_ORIGINAL_COMMAND-}"
deploy_pattern='^deploy [0-9a-f]{40} sha256:[0-9a-f]{64} [a-zA-Z0-9_-]+(\[bot\])?$'

if [[ "$request" =~ $deploy_pattern ]]; then
  sha=$(printf '%s' "$request" | cut -d' ' -f2)
  digest=$(printf '%s' "$request" | cut -d' ' -f3)
  actor=$(printf '%s' "$request" | cut -d' ' -f4)
  [ "${#actor}" -le 64 ] || exit 2
  exec sudo -n /usr/local/sbin/aitool-release deploy "$sha" "$digest" "$actor"
fi

if [ "$request" = rollback ]; then
  exec sudo -n /usr/local/sbin/aitool-release rollback
fi

echo "Only an exact commit SHA, image digest and GitHub actor, or rollback, is allowed." >&2
exit 2
