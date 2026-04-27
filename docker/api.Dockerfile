FROM node:20-bookworm-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update -y && apt-get install -y procps python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# 复制 workspace 配置和依赖清单（利用 Docker 缓存层）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 复制源代码
COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/

# 复制 entrypoint 脚本（docker-compose dev 模式下会被 bind mount 覆盖）
COPY docker/entrypoint-api.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8081

ENTRYPOINT ["entrypoint.sh"]
CMD ["pnpm", "--filter", "api", "dev"]
