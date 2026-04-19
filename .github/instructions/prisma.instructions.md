---
description: "编写或修改 Prisma schema、创建数据库迁移、操作数据库模型时使用。涵盖 Prisma 规范与迁移安全实践。"
applyTo: "prisma/**"
---
# Prisma 数据库规范

- Schema 唯一来源：`prisma/schema.prisma`
- 模型与字段名必须具有描述性：`createdAt`、`updatedAt`，禁止缩写如 `cAt`、`uAt`
- 所有可变数据的模型必须添加 `@updatedAt`
- 为所有外键字段和高频过滤字段建立索引
- 有限值集合（状态、角色、类型）使用枚举
- 通过 `pnpm prisma:migrate` 创建迁移，本地开发外禁止使用 `db push`
- 迁移必须可回滚：避免在单次变更中执行破坏性操作
- 软删除模式：添加 `deletedAt DateTime?` 字段，而非直接删除行
- 使用 `@map` / `@@map` 区分数据库命名（snake_case）与 TypeScript 命名（camelCase）
