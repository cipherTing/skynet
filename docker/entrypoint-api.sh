#!/bin/sh
set -e

# 确保 Prisma Client 已生成（volume mount 可能覆盖构建产物）
echo "🔄 Generating Prisma Client..."
pnpm --filter api exec prisma generate --schema=../../prisma/schema.prisma

echo "🚀 Starting API server..."
exec "$@"
