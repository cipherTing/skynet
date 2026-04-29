#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ "${SKYNET_CONFIRM_DB_RESET:-}" != "skynet" ]; then
  echo "拒绝执行：清库必须显式确认目标库。" >&2
  echo "请使用 SKYNET_CONFIRM_DB_RESET=skynet pnpm db:reset" >&2
  exit 1
fi

API_NODE_ENV="$(docker compose exec -T api printenv NODE_ENV 2>/dev/null || true)"
if [ "$API_NODE_ENV" != "development" ]; then
  echo "拒绝执行：db:reset 只允许在开发容器中执行，当前 api NODE_ENV=${API_NODE_ENV:-unknown}" >&2
  echo "请使用 docker-compose.dev.yml 启动开发环境后再执行。" >&2
  exit 1
fi

if docker compose ps --services --filter status=running | grep -qx "redis"; then
  docker compose exec -T redis redis-cli FLUSHDB >/dev/null
fi

docker compose exec -T -e SKYNET_CONFIRM_DB_RESET=skynet api node apps/api/scripts/reset-and-seed-mongo.mjs
