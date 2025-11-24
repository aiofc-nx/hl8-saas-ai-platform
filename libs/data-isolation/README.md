# 数据隔离基础设施模块

该模块聚焦跨领域的多层级数据隔离支撑能力，支持租户、组织、部门等层级的隔离，提供统一的隔离上下文管理、请求拦截、数据持久化隔离与异常处理能力，作为 Clean Architecture 基础设施层的一部分，为领域服务和接口适配层提供一致的开发体验。

## 目录结构说明

```
libs/data-isolation
├── README.md                       ← 当前文档
├── eslint.config.mjs               ← 继承平台 ESLint 规则
├── jest.config.ts                   ← Jest 测试配置
├── package.json                    ← 模块元信息与对外导出定义
├── src
│   ├── index.ts                    ← 导出公共 API
│   └── lib
│       ├── interceptors
│       │   ├── isolation-enforce.interceptor.ts
│       │   └── isolation-enforce.interceptor.spec.ts
│       ├── persistence
│       │   ├── base-isolated.repository.ts
│       │   ├── base-isolated.repository.spec.ts
│       │   ├── isolation-aware.subscriber.ts
│       │   └── isolation-aware.subscriber.spec.ts
│       ├── isolation-cls-store.ts
│       ├── isolation-context.executor.ts
│       ├── isolation-context.executor.spec.ts
│       ├── isolation-context.module.ts
│       └── isolation-context.module.spec.ts
└── tsconfig*.json                  ← TypeScript 构建配置
```

## 核心机制概述

### CLS 请求作用域

- 借助 `nestjs-cls` 在 Fastify/Nest 请求生命周期内创建基于 CLS（Continuation Local Storage）的上下文容器；
- `IsolationContextModule` 在 `onModuleInit` 阶段初始化 CLS，注入来自 HTTP Header、消息队列或后台任务触发的执行上下文信息；
- 所有依赖该模块的服务通过注入 `IsolationClsStore` 读取当前请求的隔离上下文信息，避免手动传递上下文。

### 数据隔离上下文执行器

- `IsolationContextExecutor` 对外暴露 `getTenantIdOrFail()`、`getExecutionContextOrFail()` 与 `runWithIsolationContext()` 等方法；
- `getTenantIdOrFail()` 用于获取当前请求的租户标识，缺失时抛出 `GeneralUnauthorizedException` 异常并记录错误日志（向后兼容方法）；
- `getExecutionContextOrFail()` 用于获取完整的执行上下文，包含租户、组织、部门等信息；
- `runWithIsolationContext()` 支持在新的 CLS 作用域下执行回调，并预先写入完整的执行上下文，支持多层级隔离；
- `runWithTenantContext()` 用于向后兼容，支持仅设置租户标识的场景；
- 在执行 CQRS 命令、查询或后台任务前统一校验隔离上下文是否存在，若缺失则抛出中文业务异常并写入统一日志；
- 支持在同一线程内切换临时隔离上下文（如后台任务）并在执行完毕后自动恢复上下文，保证线程安全。

### 请求拦截与守卫

- `IsolationEnforceInterceptor` 在请求进入控制器前拦截，自动解析 Header/Token 中的隔离上下文信息；
- 优先从 `request.executionContext` 获取完整的执行上下文（包含租户、组织、部门等信息）；
- 向后兼容：支持从多个来源获取租户 ID：`request.tenantId`、`x-tenant-id` Header、`request.user.tenantId`，按优先级顺序解析；
- 将解析结果写入 CLS，同时对接 MikroORM 过滤器，确保 ORM 查询自动带上隔离条件；
- 自动校验隔离上下文的有效性（非空、非空白字符串），防止无效输入；
- 若检测到越权访问（请求内携带的隔离信息与上下文不一致），则记录敏感日志并阻断请求链路；
- 支持通过 `@SkipIsolation()` 装饰器跳过特定控制器或处理器的隔离校验（`@SkipTenant()` 作为向后兼容别名）。

### 数据持久化隔离

- `BaseIsolatedRepository` 封装 MikroORM 仓储常见操作，自动在 `findOne()`, `nativeUpdate()`, `nativeDelete()` 等操作中注入隔离条件（如 `tenantId`）；
- 自动检测并阻止跨隔离边界访问尝试，当查询条件中的隔离字段与上下文不一致时抛出 `GeneralForbiddenException`；
- `IsolationAwareSubscriber` 在实体创建与更新前检查隔离字段（如 `tenantId`），防止开发者遗漏设置导致数据串租；
- 实体创建时若未设置隔离字段，自动从上下文注入；若已设置但与上下文不一致，则抛出异常阻止写入；
- 实体更新时校验隔离字段一致性，防止跨隔离边界更新操作；
- 支持通过 `IsolationAwareSubscriberOptions` 配置数据库连接名称，适配多数据源场景（默认使用默认连接）；
- 通过事件订阅机制记录每次跨隔离边界写入尝试，支撑后续审计与报警。

## 工作流程

1. **入口解析**：HTTP 请求、消息或任务调度进入时由拦截器读取隔离上下文标识；
2. **上下文建立**：`IsolationContextModule` 将隔离上下文信息写入 CLS，后续依赖者可随时读取；
3. **隔离校验**：业务用例通过 `IsolationContextExecutor` 统一校验，缺失时直接抛出业务异常；
4. **数据访问**：仓储层基类与订阅器依据当前上下文自动拼接隔离条件；
5. **日志与监控**：所有异常路径输出中文日志，支持与 `libs/infra/logger` 对接做统一追踪。

## 集成指引

1. 在业务模块中引入 `@hl8/data-isolation` 并导入 `IsolationContextModule`：

   ```typescript
   import { IsolationContextModule } from '@hl8/data-isolation';

   @Module({
     imports: [IsolationContextModule.register()],
   })
   export class AppModule {}
   ```

2. 在路由层使用 `IsolationEnforceInterceptor` 或自定义守卫，确保入口统一：

   ```typescript
   import { IsolationEnforceInterceptor } from '@hl8/data-isolation';

   @UseInterceptors(IsolationEnforceInterceptor)
   @Controller('users')
   export class UsersController {}
   ```

3. 领域仓储继承 `BaseIsolatedRepository`，减少手动维护过滤条件：

   ```typescript
   import { BaseIsolatedRepository } from '@hl8/data-isolation';

   export class UserRepository extends BaseIsolatedRepository<User> {
     // 自动注入隔离过滤条件（如 tenantId）
   }
   ```

4. 在 CQRS handler、定时任务等位置通过 `IsolationContextExecutor` 包裹执行逻辑：

   ```typescript
   // 推荐：使用完整的执行上下文
   await this.isolationExecutor.runWithIsolationContext(
     executionContext,
     async () => {
       // 业务逻辑
     },
   );

   // 向后兼容：仅设置租户标识
   await this.isolationExecutor.runWithTenantContext(tenantId, async () => {
     // 业务逻辑
   });
   ```

5. 与 `@hl8/logger`、`@hl8/config` 配合，将隔离上下文信息写入日志与配置缓存。

## 向后兼容性

为了平滑迁移，模块保留了以下向后兼容的 API：

- `BaseTenantRepository` → `BaseIsolatedRepository`（别名）
- `TenantAwareSubscriber` → `IsolationAwareSubscriber`（别名）
- `TenantEnforceInterceptor` → `IsolationEnforceInterceptor`（别名）
- `TenantContextModule` → `IsolationContextModule`（需要在导入中显式使用新名称）
- `@SkipTenant()` → `@SkipIsolation()`（别名）
- `runWithTenantContext()` → `runWithIsolationContext()`（推荐使用新方法）

**注意**：虽然保留了向后兼容的 API，但建议新代码使用新的命名，以更清晰地表达模块的实际功能。

## 注意事项

- 所有对外服务必须保证隔离上下文的来源可信且经过鉴权；
- 禁止使用全局静态变量保存隔离上下文信息，必须通过 CLS 获取；
- 拦截器会自动校验隔离上下文的有效性（非空、非空白字符串），确保输入安全；
- 当执行跨隔离边界的后台任务时，务必使用 `runWithIsolationContext()` 显式设置上下文，执行完毕后自动恢复；
- 若结合事件驱动架构触发异步处理，需要将完整的执行上下文写入事件载荷并在消费者侧调用执行器恢复上下文；
- 使用 `BaseIsolatedRepository` 时，查询条件中的隔离字段必须与上下文一致，否则会抛出异常；
- `IsolationAwareSubscriber` 会自动处理实体创建时的隔离字段注入，但更新操作需要实体本身已包含正确的隔离字段。

## 多层级隔离支持

模块当前主要支持租户级别的隔离，未来将扩展支持：

- **组织级别隔离**：在同一租户内，支持多个组织之间的数据隔离
- **部门级别隔离**：在同一组织内，支持多个部门之间的数据隔离
- **可配置的隔离策略**：允许不同实体选择不同的隔离层级

## 测试覆盖

该模块具备完整的单元测试覆盖，测试覆盖率达到 **98.93%**，超过项目要求的 80% 标准：

- **语句覆盖率**: 98.93%
- **分支覆盖率**: 82.27%
- **函数覆盖率**: 95%
- **行覆盖率**: 98.87%

所有核心组件均包含完整的测试用例：

- `IsolationContextExecutor`: 15 个测试用例
- `IsolationEnforceInterceptor`: 16 个测试用例
- `BaseIsolatedRepository`: 12 个测试用例
- `IsolationAwareSubscriber`: 11 个测试用例
- `IsolationContextModule`: 3 个测试用例

运行测试：

```bash
pnpm test          # 运行所有测试
pnpm test:cov      # 运行测试并生成覆盖率报告
```

## 后续规划

- 扩展支持组织、部门层级的数据隔离
- 提供基于装饰器的 DTO 校验器，帮助自动校验请求中隔离字段
- 与 `@hl8/cache` 集成多层级缓存隔离策略
- 输出更多实践示例，覆盖命令总线、GraphQL、WebSocket 等场景
- 支持隔离快照的完整生命周期管理 API
- 提供可配置的隔离策略，允许不同实体选择不同的隔离层级
