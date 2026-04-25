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

### 前置审查（计划阶段）

**以下情况在执行前必须将大致计划提交 `Devils Advocate` SubAgent 审查，确认无误后方可动手**：

- 改动涉及超过一个方法/函数的代码变更
- 改动涉及配置文件、路由结构、数据库 schema 等影响面大的内容
- 新增模块或组件
- 关键重构

前置审查内容：改动的目标、涉及文件、大致方案、潜在风险点。

### 后置审查（执行阶段）

**每次完成一项改动后，必须再次调用 `Devils Advocate` SubAgent 进行审查**。流程如下：

1. 完成一项独立改动（新功能、组件重写、关键重构等）
2. **立即**调用 `Devils Advocate` 审查，提交本次改动的描述 + 具体文件路径
3. 认真阅读魔鬼代言人返回的质疑与问题清单
4. 对合理的问题进行修复，对不合理的问题在回复中说明拒绝理由
5. 修复完成后，才能进入下一项任务

**例外情况**：仅涉及文档、注释、拼写、样式微调（如颜色值调整、间距修改）的一次性小改动可以跳过前置审查和后置审查，但功能性改动和 UI 结构调整**必须**经过后置审查。

## 开发完成后测试（强制）

**每次完成功能开发后，必须进行接口或页面测试验证**：

- **纯 API 接口**：使用 `curl` 调用接口，确认返回结果符合预期
- **需要页面交互的功能**：使用 Playwright MCP 打开页面进行端到端测试
- 测试失败时必须先修复再进入下一项任务

**执行顺序**：开发 → 测试 → 审查 → 修复审查问题 → 重新测试（如有代码改动）

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

- **任何工具生成的临时文件必须存放在指定的目录内**，禁止散落在项目各处。当前约定的目录：
  - **`.playwright-mcp/`** — Playwright MCP 的截图、快照（`.yml`、`.md`）、诊断日志、控制台输出
  - **`data/`** — 运行时数据（数据库文件等）
- 新增临时文件类型时，必须在 `.gitignore` 中注册对应目录，禁止使用 `*.tmp` 之类的通配符打散到项目各处
- 所有上述目录已在 `.gitignore` 中配置，不提交至版本控制

## 构建与测试命令

```bash
# 安装所有依赖
pnpm install

# 开发模式（唯一方式 —— 见下方"开发环境约定"）
docker compose up -d --build

# 构建
pnpm --filter @skynet/web build
pnpm --filter @skynet/api build

# 测试
pnpm --filter @skynet/web test
pnpm --filter @skynet/api test

# 代码检查与格式化
pnpm lint
pnpm format

# 数据库
pnpm prisma:generate         # 生成 Prisma Client
pnpm prisma:studio           # 打开 Prisma Studio

# Docker（生产环境 / 完整环境）
docker compose up -d --build  # 构建并启动所有服务
docker compose down           # 停止并移除容器
docker compose logs -f api    # 查看 API 日志
```

### Docker 更新流程

代码更新后需要重新构建 Docker 镜像：

- **代码改动**：`docker compose up -d --build`（重新构建镜像）
- **Schema 改动**：构建后还需 `docker compose exec api npx prisma db push`
- **仅配置改动**（docker-compose.yml / .env）：`docker compose up -d`（无需 --build）

## 开发环境约定

### 统一使用 Docker 进行开发

- **唯一开发方式**：所有开发调试必须通过 `docker compose up -d --build` 启动，禁止同时运行本地 `pnpm --filter @skynet/web dev` 或 `pnpm --filter @skynet/api dev`
- **端口竞争处理**：若 Docker 容器因端口被占用而启动失败，**不得偷偷更换端口**。应排查并停止占用端口的本地进程，确保 Docker 为唯一服务提供者
- **原因**：本地 dev server 与 Docker 容器共用相同端口（8080/8081），会导致请求路由混乱（如 CSS/JS 404），造成难以排查的幽灵问题

### ⚠️ Playwright 截图规范（强制）

- **所有 Playwright MCP 截图、访问日志、诊断输出必须存放在项目根目录的 `.playwright-mcp/` 文件夹内**
- **禁止将截图或其他临时文件散落到项目其他位置（尤其是项目根目录），避免污染版本控制**
- **每次调用 `browser_take_screenshot` 时，`filename` 参数必须以 `.playwright-mcp/` 开头**：
  ```
  browser_take_screenshot({ type: "png", filename: ".playwright-mcp/xxx.png" })
  ```
- `.playwright-mcp/` 已配置在 `.gitignore` 中，不会被提交到版本控制

## 用户交互偏好

- **当用户提出问题时，必须先给出问题的答案和解释，然后提供可选的建设性方案，最后询问用户是否要执行**。禁止在尚未回答问题和获得用户确认的情况下直接修改文件。

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
- **页面间导航必须使用 Next.js `<Link>` 组件，禁止用 HTML 原生 `<a>` 标签**
- **项目完全基于现代 React 技术栈构建，所有交互行为通过 React 生命周期管理**

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

## 安全架构

### 认证
- JWT 认证，`JWT_SECRET` 通过 `.env` 加载（必需，无默认值）
- 密码使用 bcrypt（cost 12）加密存储
- 登录端点有恒定时间 bcrypt 比较（防时序攻击）
- `@Public()` 装饰器标记公开路由，JwtAuthGuard 在公开路由上仍解析 JWT（可选认证），使 `@CurrentUser()` 可用

### 速率限制
- 全局 `@nestjs/throttler` 三级限制：short（1s/3次）、medium（10s/20次）、long（60s/100次）
- 登录端点：10s/5次、60s/15次
- 注册端点：60s/3次、3600s/10次

### API 响应
- 全局 `TransformInterceptor`：自动包装 `{ data: ... }`，已有 `data` 字段则透传
- 全局 `HttpExceptionFilter`：统一错误格式 `{ error: { code, message, statusCode } }`
- 全局 `ValidationPipe`：whitelist + forbidNonWhitelisted + transform

## 论坛核心逻辑

### 投票系统
- 支持投票/取消/切换（同类型再投 = 取消，不同类型 = 切换）
- 使用 Prisma `$transaction` 保证原子性（投票记录 + 计数器 + hotScore 同步更新）
- Reddit Hot Algorithm：`sign * log10(max(|score|, 1)) + seconds/45000`

### 帖子排序
- `hot`（默认）：hotScore 降序 → createdAt 降序
- `latest`：createdAt 降序

### 回复层级
- 最多两层嵌套（顶级回复 + 子回复）
- `@用户名` 提及会在前端高亮

---

## AGENTS.md 编写约束（Harness 工程要求）

> **AGENTS.md 是约束的地图，不是解释的百科全书。**
> 以下内容是对 AGENTS.md 本身的约束，防止文档膨胀和失效。

### 必须遵守的约束

- **只放约束和边界，不放解释和说明**。使用"必须"、"禁止"、"始终"等强制性语言。禁止使用"因为..."、"目的是..."、"通过...实现了..."等解释性 prose。
- **不放具体实现细节**。禁止出现字段名（如 `suspendedAt`、`tokenVersion`）、方法名（如 `handleRequest`）、具体类的内部逻辑、某个功能的行为说明。这些属于代码注释或 docs/ 文档。
- **不放阶段性功能设计**。封号机制、token 撤销策略、软删除中间件等行为规范，如果确实需要记录，应放在 `docs/` 下的专门文档中，不在 AGENTS.md 中展开。
- **保持精简**。AGENTS.md 是地图，指向更深的文档来源。单节不超过必要长度。当一切都被标注为重要时，一切都不重要了。
- **渐进式披露**。如果某项约束需要大量背景知识才能理解，说明它不应该出现在 AGENTS.md 中。把它放到 `docs/` 目录，在 AGENTS.md 中只保留一条指向它的链接。

### 更新时的自检清单

在修改 AGENTS.md 之前，逐条回答：

1. **这是约束还是解释？** 如果是解释，不放。
2. **这是核心约束还是阶段性细节？** 如果会随着功能迭代而过时，不放。
3. **这里出现了字段名/方法名/类名吗？** 如果出现了，不放。
4. **这段内容能放进一句"必须/禁止"里吗？** 如果不能，考虑拆分或移出。
5. **这段内容是给 Agent 的行为边界，还是给人类的阅读说明？** 如果是后者，不放。
