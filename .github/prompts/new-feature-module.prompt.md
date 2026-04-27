---
description: "根据项目规范脚手架一个新的 NestJS 功能模块，包含控制器、服务、DTO 和模块文件"
agent: "agent"
argument-hint: "功能模块名称，例如 'forum-post'"
---
在 `apps/api/src/` 下为给定的功能名称创建一个新的 NestJS 功能模块。

遵循 [AGENTS.md](../../AGENTS.md) 和 [NestJS 规范](../instructions/nestjs.instructions.md) 中的项目约定。

生成以下文件：
1. `{feature}.module.ts` — 包含导入的 NestJS 模块
2. `{feature}.controller.ts` — 含 CRUD 端点和 Swagger 装饰器的 REST 控制器
3. `{feature}.service.ts` — 注入 Mongoose Model 或领域服务的服务
4. `dto/create-{feature}.dto.ts` — 含 class-validator 装饰器的创建 DTO
5. `dto/update-{feature}.dto.ts` — 基于创建 DTO 的 PartialType 更新 DTO
6. 如需持久化，新增 `apps/api/src/database/schemas/{feature}.schema.ts`

所有 DTO 验证使用 `class-validator`。数据库访问使用 NestJS Mongoose 注入；新增 schema 必须注册到 `DatabaseModule` 的 `MongooseModule.forFeature`。添加 `@ApiTags()` 和完整的 Swagger 操作装饰器。
