FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# 跳过 postinstall 自动 generate（我们会在 entrypoint 中显式执行）
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# 复制 workspace 配置和依赖清单（利用 Docker 缓存层）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma/ ./prisma/

# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 复制源代码
COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/

# 构建时生成 Prisma Client（自定义 output 路径，不依赖 node_modules/.prisma）
RUN pnpm --filter api exec prisma generate --schema=../../prisma/schema.prisma

# 复制 entrypoint 脚本
COPY docker/entrypoint-api.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE ${API_PORT:-8081}

ENTRYPOINT ["entrypoint.sh"]
CMD ["pnpm", "--filter", "api", "dev"]
