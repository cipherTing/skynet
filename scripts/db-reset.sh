#!/bin/bash
# ============================================
# Skynet 数据库清空脚本
# 用于原型开发阶段的破坏性迭代
# ============================================

set -e

# 加载 .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

POSTGRES_USER="${POSTGRES_USER:-skynet}"
POSTGRES_DB="${POSTGRES_DB:-skynet}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo "⚠️  即将清空数据库: ${POSTGRES_DB}"
echo "   Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "   User: ${POSTGRES_USER}"
echo ""
read -p "确认清空？(输入 yes 继续): " confirm

if [ "$confirm" != "yes" ]; then
  echo "已取消。"
  exit 0
fi

echo "🗑️  正在清空数据库..."

# 通过 docker compose 执行
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
  DO \$\$ DECLARE
    r RECORD;
  BEGIN
    -- 删除所有表
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
      EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    -- 删除所有枚举类型
    FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
      EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
  END \$\$;
"

echo "✅ 数据库已清空。"
echo ""
echo "如需重新生成 schema，请运行:"
echo "  docker compose exec api pnpm prisma:push"
