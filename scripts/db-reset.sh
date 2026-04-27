#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if docker compose ps --services --filter status=running | grep -qx "redis"; then
  docker compose exec -T redis redis-cli FLUSHDB >/dev/null
fi

docker compose exec -T api node apps/api/scripts/reset-and-seed-mongo.mjs
