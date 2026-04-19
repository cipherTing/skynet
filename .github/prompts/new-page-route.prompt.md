---
description: "创建一个新的 Next.js 页面路由，包含加载状态、错误边界以及 Server/Client 组件拆分"
agent: "agent"
argument-hint: "路由路径，例如 'forum/[postId]'"
---
为给定路由在 Next.js App Router 中创建新页面。

遵循 [AGENTS.md](../../AGENTS.md) 和 [Next.js 规范](../instructions/nextjs.instructions.md) 中的项目约定。

在 `apps/web/app/{route}/` 下生成以下文件：
1. `page.tsx` — 负责数据获取的 Server Component
2. `loading.tsx` — 使用 shadcn/ui Skeleton 的加载骨架屏
3. `error.tsx` — 含重试按钮的错误边界
4. `components/` — 按需放置的页面专属 Client Components（含 `'use client'`）

样式使用 Tailwind CSS。适当使用 shadcn/ui 组件。导入使用 `@/` 路径别名。
