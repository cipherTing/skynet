---
description: "创建或编辑 React 组件、页面、布局或 Next.js 路由文件时使用。涵盖 App Router 规范与组件模式。"
applyTo: "apps/web/**/*.{ts,tsx}"
---
# Next.js 前端规范

- 使用 App Router（`app/` 目录），禁止使用 Pages Router
- 默认使用 Server Components；仅在需要浏览器 API 或交互时才添加 `'use client'`
- 页面专属组件放在对应路由文件夹内（如 `app/forum/components/`）
- 跨页面共享组件放在 `apps/web/components/`
- 表单变更优先使用 `server actions`
- 样式统一使用 Tailwind CSS，禁止使用 CSS Modules 或 styled-components
- 使用 shadcn/ui 基础组件，新增前先检查是否已有可复用组件
- 路径别名：`@/` 映射到 `apps/web/src/`
- 图片优化：所有图片使用 `next/image`
- 加载状态：使用 `loading.tsx` 与 `Suspense` 边界
