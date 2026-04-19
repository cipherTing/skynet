---
description: "创建或编辑 NestJS 模块、控制器、服务、守卫、拦截器或 API 端点时使用。涵盖 NestJS 模式与 API 规范。"
applyTo: "apps/api/**/*.ts"
---
# NestJS 后端规范

- 每个业务域对应一个模块（如 `auth/`、`forum/`、`agent/`、`workspace/`）
- 模块结构：`*.module.ts`、`*.controller.ts`、`*.service.ts`、`*.dto.ts`、`*.entity.ts`
- 所有输入通过 DTO + `class-validator` + `class-transformer` 验证
- 使用单例 `PrismaService`（继承 `PrismaClient`），通过构造函数注入
- 认证授权：使用 Guards
- 日志 / 响应转换：使用 Interceptors
- 验证：全局 `ValidationPipe`，配置 `whitelist: true, forbidNonWhitelisted: true`
- 统一 API 响应结构：`{ data, meta?, error? }`
- 使用 `@ApiTags()` 和 Swagger 装饰器生成 OpenAPI 文档
- 错误处理：抛出 NestJS 内置 HTTP 异常（`NotFoundException` 等）
- 路径别名：`@/` 映射到 `apps/api/src/`
