# Skynet — AI Agent 论坛与工作站

一个供 AI Agent（OpenClaw、Hermes 等）自由交流、协作完成项目的论坛 + 工作站平台。

## 交流语言

**必须使用中文与用户交流。** 所有回复、解释、代码注释建议均使用中文。

## 产品愿景

产品愿景文档（`产品愿景.md`）可以随时调用查阅，但**该文档仅提供大致的开发方向和产品理念，绝对不代表实际开发的具体内容**。实际开发以用户的指令和当前阶段的需求为准。

## 开发阶段

当前处于 **原型开发阶段**，适用以下特殊约束：

- **数据库迁移**：不需要考虑。Schema 变更直接 `db push`，不创建 migration 文件
- **数据库清空**：项目提供 `scripts/db-reset.sh` 脚本，发生破坏性迭代时可随时手动清空数据库
- **前端 UI 库**：允许按需接入第三方 UI 库和组件库，不限于 shadcn/ui
- **Vibe Coding**：这是一个 vibe coding 项目，用户的想法可能非常抽象。**如果可以，请尽可能向用户提问**，确认需求后再动手

## 审查流程（强制）

**每次完成一项改动后，必须调用 `Devils Advocate` SubAgent 进行审查**。流程如下：

1. 完成一项独立改动（新功能、组件重写、关键重构等）
2. **立即**调用 `Devils Advocate` 审查，提交本次改动的描述 + 具体文件路径
3. 认真阅读魔鬼代言人返回的质疑与问题清单
4. 对合理的问题进行修复，对不合理的问题在回复中说明拒绝理由
5. 修复完成后，才能进入下一项任务

**例外情况**：仅涉及文档、注释、拼写、样式微调（如颜色值调整、间距修改）的一次性小改动可以跳过，但功能性改动和 UI 结构调整**必须**审查。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| 后端 | NestJS + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| 缓存 / 队列 | Redis + BullMQ |
| Monorepo | pnpm workspaces（包：`apps/web`、`apps/api`、`packages/shared`）|

## 项目结构

```
skynet/
├── apps/
│   ├── web/          # Next.js 前端（App Router）
│   └── api/          # NestJS 后端
├── packages/
│   └── shared/       # 共享类型、常量、工具函数
├── prisma/           # Prisma schema 与数据库迁移
├── docker/           # Docker 与 docker-compose 配置
├── .github/          # CI、instructions、prompts、agents
├── .playwright-mcp/  # Playwright MCP 临时截图和诊断日志（ignore）
└── AGENTS.md
```

### 临时文件与 Ignore 规则

**`.playwright-mcp/`** — Playwright MCP server 生成的临时截图、访问日志（`.yml`）和控制台输出。每次调用后自动生成，**不提交至版本控制**。无需手动清理，CI 环境会自动忽略。

## 构建与测试命令

```bash
# 安装所有依赖
pnpm install

# 开发模式
pnpm --filter web dev        # Next.js 开发服务器
pnpm --filter api dev        # NestJS 开发服务器

# 构建
pnpm --filter web build
pnpm --filter api build

# 测试
pnpm --filter web test
pnpm --filter api test

# 代码检查与格式化
pnpm lint
pnpm format

# 数据库
pnpm prisma:generate         # 生成 Prisma Client
pnpm prisma:migrate          # 执行数据库迁移
pnpm prisma:studio           # 打开 Prisma Studio
```

## 代码规范

### 通用
- **语言**：所有代码使用 TypeScript，开启 strict 模式
- **零警告零错误**：代码构建和编译过程中不允许出现任何 warning 或 error。所有警告必须在提交前修复，不允许通过 suppress 注释绕过
- **风格**：遵循 ESLint + Prettier 配置，不手动争论格式问题
- **导入**：使用路径别名（`@/`、`@shared/`），禁止深层相对路径（`../../../`）
- **错误处理**：禁止静默吞咽错误；在 API 边界使用类型化错误类
- **禁止走捷径**：优先选择正确、可维护的方案，遵循行业最佳实践，不写技术债
- **遇到问题先调查**：当遇到不熟悉的集成问题或错误时，**禁止盲目尝试各种 hack 或变通方案**。必须先通过互联网调查问题的根因和官方推荐的解决方式，找到最佳实践后再动手。反复试错式的"绕近路"只会浪费时间并引入更多问题

### 前端（Next.js）
- 使用 App Router（`app/` 目录），默认使用 Server Components
- 仅在需要浏览器 API 或交互时才加 `'use client'`
- 页面专属组件放在对应路由文件夹内
- 表单变更优先使用 `server actions`
- 样式统一用 Tailwind CSS，禁止内联 style 对象
- 使用 shadcn/ui 组件，允许按需接入其他第三方 UI 库和组件库

### 后端（NestJS）
- 每个业务域对应一个 NestJS 模块（如 `auth/`、`forum/`、`agent/`）
- 所有 API 输入通过 DTO + `class-validator` 验证
- 使用单例 `PrismaService`（继承 `PrismaClient`）
- 认证用 Guards，日志/转换用 Interceptors，验证用 Pipes
- 所有接口返回统一响应结构

### 数据库（Prisma）
- 唯一来源：`prisma/schema.prisma`
- 模型与字段名具有描述性，禁止缩写
- **原型阶段**：直接使用 `db push`，不创建 migration 文件
- 为外键和高频查询字段建立索引

### 缓存 / 队列（Redis + BullMQ）
- Redis 用于 session、缓存和限流
- BullMQ 用于异步任务处理（邮件、通知、重计算）
- 所有队列处理器必须是幂等的

### Shared 包
- 只导出类型、常量和纯工具函数
- 不依赖前端或后端框架的运行时

## 架构原则

- **关注点分离**：前端负责 UI/UX，后端负责业务逻辑，shared 负责类型共享
- **渐进式开发**：按需增量构建，不提前脚手架未需要的功能
- **技术债务意识**：用 `// TODO(tech-debt):` 标记捷径，并在 issue 中跟踪
- **安全优先**：遵循 OWASP Top 10，验证所有输入，净化所有输出
- **保持文档同步**：随项目进度持续更新本文件及相关文档
