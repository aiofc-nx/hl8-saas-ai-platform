# apps/api 与 apps/fastify-api 差异对比报告

## 概述

`apps/api` 和 `apps/fastify-api` 是两个基于 NestJS + Fastify 的 API 项目。主要差异在于 `apps/fastify-api` 已移除所有数据库相关代码，而 `apps/api` 仍保留完整的数据库功能。

## 主要差异

### 1. 依赖差异 (package.json)

#### apps/api 包含（apps/fastify-api 已移除）：
- `pg: ^8.13.1` - PostgreSQL 客户端
- `@nestjs/typeorm: ^11.0.0` - TypeORM NestJS 集成
- `typeorm: ^0.3.20` - TypeORM ORM 框架

#### apps/fastify-api 已移除：
- 所有 TypeORM 相关依赖
- PostgreSQL 客户端依赖

### 2. 目录结构差异

#### apps/api 包含（apps/fastify-api 已删除）：
```
src/
├── database/              # 数据库模块
│   ├── database.module.ts
│   ├── transaction.service.ts
│   └── index.ts
└── features/
    ├── auth/              # 认证功能模块
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── entities/
    │   └── dto/
    └── users/             # 用户功能模块
        ├── users.controller.ts
        ├── users.service.ts
        ├── users.module.ts
        └── entities/
```

#### apps/fastify-api 当前结构：
```
src/
└── features/
    ├── file/              # 文件功能模块
    ├── health/            # 健康检查模块
    └── mail/              # 邮件功能模块
```

### 3. 模块导入差异 (app.module.ts)

#### apps/api:
```typescript
imports: [
  // ...
  DatabaseModule,      // ✅ 包含
  UsersModule,         // ✅ 包含
  AuthModule,          // ✅ 包含
  // ...
]
```

#### apps/fastify-api:
```typescript
imports: [
  // ...
  // DatabaseModule,   // ❌ 已移除
  // UsersModule,      // ❌ 已移除
  // AuthModule,       // ❌ 已移除
  MailModule,
  HealthModule,
  FileModule,
]
```

### 4. 环境变量配置差异 (validateEnv.ts)

#### apps/api 包含的数据库环境变量：
```typescript
DB_HOST: z.string(),
DB_PORT: z.string(),
DB_USERNAME: z.string(),
DB_PASSWORD: z.string(),
DB_NAME: z.string(),
DB_SSL: z.string().transform((value) => value === 'true'),
```

#### apps/fastify-api：
- ❌ 已移除所有数据库相关环境变量
- ✅ 仅保留：服务器、CORS、JWT、邮件、文件存储配置

### 5. 健康检查差异 (health.controller.ts)

#### apps/api:
- ✅ 包含 `TypeOrmHealthIndicator`
- ✅ 包含 `checkDatabase()` 方法
- ✅ 提供 `/health/database` 端点

#### apps/fastify-api:
- ❌ 已移除 `TypeOrmHealthIndicator`
- ❌ 已移除 `checkDatabase()` 方法
- ❌ 不提供数据库健康检查端点
- ✅ 仅保留：HTTP、磁盘、内存健康检查

### 6. JwtRefreshGuard 差异

#### apps/api:
```typescript
// 依赖数据库，检查 Session 实体
@InjectRepository(Session)
private readonly SessionRepository: Repository<Session>

// 验证逻辑包含数据库查询
const session = await this.SessionRepository.findOne({
  where: { refresh_token: token, user_id: request.user.id }
});
```

#### apps/fastify-api:
```typescript
// 不依赖数据库
// 仅验证 JWT 令牌有效性
// 不检查数据库中的会话记录
```

### 7. 代码注释语言差异

#### apps/api:
- 使用英文注释
- 注释格式：标准 JSDoc

#### apps/fastify-api:
- 使用中文注释（符合项目章程）
- 注释格式：TSDoc 规范
- 包含完整的 `@description`、`@param`、`@returns`、`@throws` 等标记

### 8. 实体和接口差异

#### apps/api 包含：
- `src/common/entities/base.entity.ts` - TypeORM 实体基类
- `src/features/auth/entities/` - Session、Otp 实体
- `src/features/users/entities/` - User、Profile 实体
- `src/common/interfaces/auth.interface.ts` - 认证相关接口

#### apps/fastify-api：
- ❌ 已删除所有实体文件
- ❌ 已删除 `auth.interface.ts`
- ✅ `common/entities/index.ts` 仅保留占位注释

## 功能对比

| 功能模块 | apps/api | apps/fastify-api |
|---------|---------|-----------------|
| 数据库连接 | ✅ TypeORM + PostgreSQL | ❌ 无 |
| 用户管理 | ✅ 完整功能 | ❌ 已删除 |
| 认证系统 | ✅ 完整功能（注册、登录、登出等） | ❌ 已删除 |
| 会话管理 | ✅ 数据库存储 | ❌ 已删除 |
| JWT 认证 | ✅ 完整功能 | ✅ 保留（仅令牌验证） |
| 文件上传 | ✅ 支持 | ✅ 支持 |
| 邮件服务 | ✅ 支持 | ✅ 支持 |
| 健康检查 | ✅ 包含数据库检查 | ✅ 不包含数据库检查 |

## 总结

### apps/api
- **状态**：完整的 API 服务，包含数据库功能
- **用途**：生产环境，需要数据库持久化
- **特点**：完整的用户认证、会话管理、数据持久化

### apps/fastify-api
- **状态**：精简版 API 服务，无数据库依赖
- **用途**：微服务架构中的无状态服务，或作为 API 网关
- **特点**：
  - 无数据库依赖
  - 仅保留 JWT 令牌验证（不检查数据库会话）
  - 代码注释符合项目章程（中文 TSDoc）
  - 更轻量级，启动更快

## 迁移建议

如果要从 `apps/api` 迁移到 `apps/fastify-api` 的架构：

1. **移除数据库依赖**：删除所有 TypeORM 相关代码
2. **重构 JwtRefreshGuard**：移除数据库会话检查
3. **更新环境变量**：移除数据库配置
4. **更新健康检查**：移除数据库健康检查端点
5. **更新代码注释**：改为中文 TSDoc 格式

