#!/bin/bash
set -euo pipefail

HASHES_DIR="/app/.build-hashes"
mkdir -p "$HASHES_DIR"

# --- 1. 智能 pnpm install（lockfile hash 比对）---
if [ ! -f /app/pnpm-lock.yaml ]; then
  echo "❌ FATAL: pnpm-lock.yaml not found" >&2
  exit 1
fi
LOCK_HASH=$(sha256sum /app/pnpm-lock.yaml | cut -d' ' -f1)
CACHED_LOCK=$(cat "$HASHES_DIR/.lock-hash" 2>/dev/null || echo "")

if [ "$LOCK_HASH" = "$CACHED_LOCK" ] && [ -d /app/node_modules/.pnpm ]; then
  echo "[OK] Dependencies up to date, skipping install"
else
  echo "[INSTALL] Installing dependencies..."
  pnpm install --frozen-lockfile
  echo "$LOCK_HASH" > "$HASHES_DIR/.lock-hash"
fi

# --- 2. 智能 Prisma generate（schema hash 比对）---
if [ ! -f /app/prisma/schema.prisma ]; then
  echo "❌ FATAL: prisma/schema.prisma not found" >&2
  exit 1
fi
SCHEMA_HASH=$(sha256sum /app/prisma/schema.prisma | cut -d' ' -f1)
CACHED_SCHEMA=$(cat "$HASHES_DIR/.schema-hash" 2>/dev/null || echo "")

if [ "$SCHEMA_HASH" = "$CACHED_SCHEMA" ] && [ -d /app/apps/api/generated/prisma ]; then
  echo "[OK] Prisma Client up to date, skipping generate"
else
  echo "[PRISMA] Generating Prisma Client..."
  pnpm --filter api exec prisma generate --schema=../../prisma/schema.prisma
  echo "$SCHEMA_HASH" > "$HASHES_DIR/.schema-hash"
fi

# --- 3. 等待 PostgreSQL 就绪 ---
echo "[WAIT] Waiting for PostgreSQL..."
PG_RETRIES=0
PG_MAX_RETRIES=30
until node -e "const net=require('net');const c=net.connect(5432,'postgres');c.on('connect',()=>{c.end();process.exit(0)});c.on('error',()=>process.exit(1))" 2>/dev/null; do
  PG_RETRIES=$((PG_RETRIES + 1))
  if [ "$PG_RETRIES" -ge "$PG_MAX_RETRIES" ]; then
    echo "❌ FATAL: PostgreSQL not ready after ${PG_MAX_RETRIES}s" >&2
    exit 1
  fi
  sleep 1
done
echo "[OK] PostgreSQL is ready"

# --- 4. 等待 Redis 就绪 ---
echo "[WAIT] Waiting for Redis..."
REDIS_RETRIES=0
REDIS_MAX_RETRIES=15
until node -e "const net=require('net');const c=net.connect(6379,'redis');c.on('connect',()=>{c.end();process.exit(0)});c.on('error',()=>process.exit(1))" 2>/dev/null; do
  REDIS_RETRIES=$((REDIS_RETRIES + 1))
  if [ "$REDIS_RETRIES" -ge "$REDIS_MAX_RETRIES" ]; then
    echo "❌ FATAL: Redis not ready after ${REDIS_MAX_RETRIES}s" >&2
    exit 1
  fi
  sleep 1
done
echo "[OK] Redis is ready"

# --- 5. 数据库 schema 同步（环境变量控制）---
if [ "${AUTO_DB_PUSH}" = "true" ]; then
  if [ "${NODE_ENV:-development}" = "production" ]; then
    echo "❌ FATAL: AUTO_DB_PUSH=true with NODE_ENV=production is forbidden" >&2
    exit 1
  fi
  echo "[WARN] Syncing database schema (prototype mode — may apply destructive changes)..."
  pnpm --filter api exec prisma db push --schema=../../prisma/schema.prisma --skip-generate --accept-data-loss
fi

echo "[START] Starting API server..."
exec "$@"
