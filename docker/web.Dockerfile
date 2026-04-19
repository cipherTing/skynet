FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# 复制 workspace 配置和依赖清单（利用 Docker 缓存层）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 复制源代码
COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/

# 复制 entrypoint 脚本
COPY docker/entrypoint-web.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE ${WEB_PORT:-8080}

ENTRYPOINT ["entrypoint.sh"]
CMD ["pnpm", "--filter", "web", "dev"]
