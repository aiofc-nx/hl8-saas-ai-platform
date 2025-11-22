# 认证与权限管理模块重构方案

## 文档信息

- **文档版本**：v1.0.0
- **创建日期**：2025-01-XX
- **作者**：AI Assistant
- **状态**：待实施

---

## 目录

1. [概述](#概述)
2. [重构目标](#重构目标)
3. [当前架构分析](#当前架构分析)
4. [重构方案设计](#重构方案设计)
5. [新库结构设计](#新库结构设计)
6. [实施步骤](#实施步骤)
7. [兼容性与迁移](#兼容性与迁移)
8. [风险评估](#风险评估)
9. [测试策略](#测试策略)
10. [后续规划](#后续规划)

---

## 概述

### 背景

当前 `iam-api` 应用中的身份认证和权限管理功能直接耦合在应用代码中，这些功能具有高度的通用性，可以抽取为独立的可复用模块，供其他 NestJS 项目使用。

### 重构范围

本次重构将以下功能模块化：

- ✅ JWT 认证守卫（`JwtAuthGuard`）
- ✅ JWT 刷新令牌守卫（`JwtRefreshGuard`）
- ✅ 基于角色的权限守卫（`RolesGuard`）
- ✅ 认证装饰器（`@Public`、`@Roles`、`@User`）
- ✅ 角色类型定义
- ✅ 认证配置接口

### 不包含在本次重构的内容

以下内容暂不抽取，保持应用层实现：

- ❌ 认证服务（`AuthService`）- 业务逻辑耦合
- ❌ 认证控制器（`AuthController`）- 路由定义
- ❌ 用户实体和会话实体 - 数据模型
- ❌ DTO 类 - 应用层数据结构
- ❌ 业务相关的工具函数

---

## 重构目标

### 主要目标

1. **可复用性**：将认证和权限管理功能抽取为独立的 `@hl8/auth` 库
2. **解耦**：降低应用层与认证逻辑的耦合度
3. **标准化**：提供统一的认证和权限管理接口
4. **可扩展性**：支持不同项目的定制需求
5. **向后兼容**：确保现有 `iam-api` 应用无需修改业务代码

### 非功能性目标

- **性能**：保持或提升性能，不引入额外开销
- **类型安全**：完整的 TypeScript 类型定义
- **文档**：提供完整的中文 TSDoc 文档
- **测试覆盖**：单元测试覆盖率 ≥ 80%

---

## 当前架构分析

### 当前代码结构

```
apps/iam-api/src/
├── common/
│   ├── constants/
│   │   └── role.ts                    # 角色类型定义
│   ├── decorators/
│   │   ├── public.decorator.ts        # @Public 装饰器
│   │   ├── roles.decorator.ts         # @Roles 装饰器
│   │   ├── user.decorator.ts          # @User 装饰器
│   │   └── index.ts
│   └── guards/
│       ├── jwt-auth.guard.ts          # JWT 认证守卫
│       ├── jwt-refresh.guard.ts       # JWT 刷新守卫
│       ├── roles.guard.ts             # 角色权限守卫
│       └── index.ts
└── features/
    └── auth/
        ├── auth.service.ts            # 认证服务（保留）
        └── auth.controller.ts         # 认证控制器（保留）
```

### 依赖关系

#### 当前守卫依赖

1. **JwtAuthGuard**
   - `@nestjs/jwt` - JWT 服务
   - `@hl8/exceptions` - 异常定义
   - `@hl8/config` - 配置管理
   - 自定义装饰器（`IS_PUBLIC_KEY`）

2. **JwtRefreshGuard**
   - `@nestjs/jwt` - JWT 服务
   - `@hl8/exceptions` - 异常定义
   - `@hl8/config` - 配置管理
   - `@hl8/mikro-orm-nestjs` - 数据库访问
   - `@mikro-orm/postgresql` - 会话实体

3. **RolesGuard**
   - `@nestjs/core` - Reflector
   - 自定义装饰器（`ROLES_KEY`）
   - 角色类型定义

#### 当前装饰器依赖

1. **@Public**
   - `@nestjs/common` - SetMetadata

2. **@Roles**
   - `@nestjs/common` - SetMetadata
   - 角色类型定义

3. **@User**
   - `@nestjs/common` - createParamDecorator

### 痛点分析

1. **代码重复**：其他项目需要实现相同的认证逻辑
2. **维护困难**：认证逻辑分散，修改需要同步多个项目
3. **测试复杂**：每个项目需要单独测试认证功能
4. **缺乏标准化**：不同项目可能实现不一致的认证方案

---

## 重构方案设计

### 新库结构

创建 `@hl8/auth` 库，包含以下模块：

```
libs/auth/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── README.md
└── src/
    ├── index.ts                       # 统一导出
    ├── auth.module.ts                 # 认证模块（NestJS 模块）
    ├── interfaces/
    │   ├── auth-config.interface.ts   # 认证配置接口
    │   ├── jwt-payload.interface.ts   # JWT 负载接口
    │   └── user.interface.ts          # 用户接口（泛型）
    ├── guards/
    │   ├── jwt-auth.guard.ts          # JWT 认证守卫
    │   ├── jwt-refresh.guard.ts       # JWT 刷新守卫
    │   ├── roles.guard.ts             # 角色权限守卫
    │   └── index.ts
    ├── decorators/
    │   ├── public.decorator.ts        # @Public 装饰器
    │   ├── roles.decorator.ts         # @Roles 装饰器
    │   ├── user.decorator.ts          # @User 装饰器
    │   └── index.ts
    ├── constants/
    │   ├── metadata-keys.constants.ts # 元数据键常量
    │   └── index.ts
    └── types/
        ├── role.type.ts               # 角色类型（泛型）
        └── index.ts
```

### 核心设计原则

#### 1. 可配置性

库提供灵活的配置选项，支持不同项目需求：

```typescript
// 认证配置接口
export interface AuthConfig {
  accessTokenSecret: string;
  accessTokenExpiration: string | number;
  refreshTokenSecret: string;
  refreshTokenExpiration: string | number;
  // 可选：自定义用户负载提取器
  extractUserFromPayload?: (payload: any) => any;
}
```

#### 2. 泛型支持

使用 TypeScript 泛型支持不同的用户和角色类型：

```typescript
// 泛型角色类型
export type Role = string;

// 泛型用户接口
export interface IUser<R extends Role = Role> {
  id: string;
  role?: R;
  [key: string]: any;
}

// JWT 负载接口
export interface IJwtPayload {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}
```

#### 3. 依赖注入

通过 NestJS 依赖注入提供守卫和服务：

```typescript
// AuthModule 提供守卫和服务
@Module({
  providers: [JwtAuthGuard, RolesGuard, JwtRefreshGuard],
  exports: [JwtAuthGuard, RolesGuard, JwtRefreshGuard],
})
export class AuthModule {
  static forRoot(config: AuthConfig): DynamicModule {
    // 动态模块配置
  }
}
```

#### 4. 可扩展性

支持自定义实现，不强制特定数据模型：

```typescript
// JwtRefreshGuard 支持自定义会话验证
export interface SessionVerifier {
  verifySession(token: string, userId: string): Promise<boolean>;
}
```

### 模块设计详解

#### AuthModule

NestJS 动态模块，用于配置认证功能：

```typescript
@Module({
  providers: [
    {
      provide: AUTH_CONFIG,
      useValue: config,
    },
    JwtAuthGuard,
    RolesGuard,
    JwtRefreshGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, JwtRefreshGuard],
})
export class AuthModule {
  static forRoot(config: AuthConfig): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: AUTH_CONFIG,
          useValue: config,
        },
      ],
      exports: [AUTH_CONFIG],
    };
  }
}
```

#### JwtAuthGuard

支持自定义配置的 JWT 认证守卫：

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @Inject(AUTH_CONFIG) private config: AuthConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 实现逻辑（与原实现类似，但使用配置）
  }
}
```

#### JwtRefreshGuard

可选的刷新令牌守卫（需要数据库支持时使用）：

```typescript
@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject(AUTH_CONFIG) private config: AuthConfig,
    @Optional()
    @Inject(SESSION_VERIFIER)
    private sessionVerifier?: SessionVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 如果提供了会话验证器，使用它；否则仅验证 JWT
  }
}
```

#### RolesGuard

支持泛型角色的权限守卫：

```typescript
@Injectable()
export class RolesGuard<R extends Role = Role> implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 支持 SUPERADMIN 特殊处理
    // 支持多个角色匹配
  }
}
```

---

## 新库结构设计

### package.json

```json
{
  "name": "@hl8/auth",
  "version": "0.1.0",
  "description": "NestJS 认证与权限管理模块，提供 JWT 认证、角色权限控制和相关装饰器",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js"
    },
    "./guards": {
      "types": "./dist/guards/index.d.ts",
      "require": "./dist/guards/index.js"
    },
    "./decorators": {
      "types": "./dist/decorators/index.d.ts",
      "require": "./dist/decorators/index.js"
    }
  },
  "dependencies": {
    "@nestjs/common": "^11.1.9",
    "@nestjs/core": "^11.1.9",
    "@nestjs/jwt": "^10.2.0"
  },
  "peerDependencies": {
    "@hl8/config": "workspace:*",
    "@hl8/exceptions": "workspace:*"
  },
  "engines": {
    "node": ">=20"
  }
}
```

### 文件清单

#### 核心文件

1. **src/index.ts** - 统一导出
2. **src/auth.module.ts** - NestJS 模块定义
3. **src/interfaces/auth-config.interface.ts** - 配置接口
4. **src/interfaces/jwt-payload.interface.ts** - JWT 负载接口
5. **src/interfaces/user.interface.ts** - 用户接口

#### 守卫文件

1. **src/guards/jwt-auth.guard.ts** - JWT 认证守卫
2. **src/guards/jwt-refresh.guard.ts** - JWT 刷新守卫
3. **src/guards/roles.guard.ts** - 角色权限守卫

#### 装饰器文件

1. **src/decorators/public.decorator.ts** - @Public 装饰器
2. **src/decorators/roles.decorator.ts** - @Roles 装饰器
3. **src/decorators/user.decorator.ts** - @User 装饰器

#### 类型和常量

1. **src/types/role.type.ts** - 角色类型定义
2. **src/constants/metadata-keys.constants.ts** - 元数据键常量

---

## 实施步骤

### 阶段一：创建新库基础结构（1-2 天）

1. **创建库目录结构**

   ```bash
   mkdir -p libs/auth/src/{guards,decorators,interfaces,types,constants}
   ```

2. **初始化 package.json**
   - 定义依赖和导出
   - 配置构建脚本

3. **配置 TypeScript**
   - 创建 `tsconfig.json` 和 `tsconfig.build.json`
   - 遵循项目规范（NodeNext、ESM）

4. **创建 README.md**
   - 库说明文档
   - 快速开始指南

### 阶段二：迁移核心代码（2-3 天）

1. **迁移类型定义**
   - 角色类型（支持泛型）
   - 用户接口（支持泛型）
   - JWT 负载接口

2. **迁移装饰器**
   - `@Public` 装饰器
   - `@Roles` 装饰器
   - `@User` 装饰器
   - 元数据键常量

3. **迁移守卫**
   - `JwtAuthGuard`（适配配置接口）
   - `RolesGuard`（支持泛型）
   - `JwtRefreshGuard`（可选会话验证）

### 阶段三：创建模块和配置（1-2 天）

1. **创建 AuthModule**
   - 动态模块配置
   - 提供者注册
   - 导出守卫和装饰器

2. **定义配置接口**
   - `AuthConfig` 接口
   - 配置验证（可选）

3. **统一导出**
   - `index.ts` 导出所有公共 API

### 阶段四：适配 iam-api（1-2 天）

1. **安装新库依赖**

   ```json
   {
     "dependencies": {
       "@hl8/auth": "workspace:*"
     }
   }
   ```

2. **更新导入路径**
   - 将 `@/common/guards` 替换为 `@hl8/auth/guards`
   - 将 `@/common/decorators` 替换为 `@hl8/auth/decorators`

3. **配置 AuthModule**

   ```typescript
   // app.module.ts
   imports: [
     AuthModule.forRoot({
       accessTokenSecret: config.ACCESS_TOKEN_SECRET,
       accessTokenExpiration: config.ACCESS_TOKEN_EXPIRATION,
       refreshTokenSecret: config.REFRESH_TOKEN_SECRET,
       refreshTokenExpiration: config.REFRESH_TOKEN_EXPIRATION,
     }),
     // ... 其他模块
   ],
   providers: [
     {
       provide: APP_GUARD,
       useClass: JwtAuthGuard, // 从 @hl8/auth 导入
     },
     // ...
   ],
   ```

4. **处理 JwtRefreshGuard 的特殊依赖**
   - 创建会话验证器实现
   - 注册到 AuthModule

### 阶段五：测试和文档（2-3 天）

1. **单元测试**
   - 守卫测试
   - 装饰器测试
   - 模块测试

2. **集成测试**
   - 在 iam-api 中测试迁移后的功能
   - 验证向后兼容性

3. **文档更新**
   - API 文档
   - 使用指南
   - 迁移指南

### 阶段六：清理和优化（1 天）

1. **删除旧代码**
   - 删除 `apps/iam-api/src/common/guards`
   - 删除 `apps/iam-api/src/common/decorators`（认证相关）
   - 删除 `apps/iam-api/src/common/constants/role.ts`

2. **代码审查**
   - 检查导入路径
   - 验证功能完整性
   - 性能检查

---

## 兼容性与迁移

### API 兼容性

#### 保持兼容的部分

1. **装饰器 API**

   ```typescript
   // 使用方式不变
   @Public()
   @Roles('ADMIN')
   @Get('profile')
   getProfile(@User() user) { }
   ```

2. **守卫行为**
   - 守卫逻辑保持一致
   - 错误消息保持一致

#### 需要调整的部分

1. **导入路径**

   ```typescript
   // 旧代码
   import { JwtAuthGuard } from '@/common/guards';
   import { Public } from '@/common/decorators';

   // 新代码
   import { JwtAuthGuard } from '@hl8/auth/guards';
   import { Public } from '@hl8/auth/decorators';
   ```

2. **模块配置**
   ```typescript
   // 需要显式配置 AuthModule
   imports: [
     AuthModule.forRoot({ ... }),
   ],
   ```

### 迁移步骤

#### 步骤 1：安装依赖

```bash
cd apps/iam-api
pnpm add @hl8/auth@workspace:*
```

#### 步骤 2：配置模块

在 `app.module.ts` 中导入并配置：

```typescript
import { AuthModule, JwtAuthGuard, RolesGuard } from '@hl8/auth';

@Module({
  imports: [
    AuthModule.forRoot({
      accessTokenSecret: config.ACCESS_TOKEN_SECRET,
      accessTokenExpiration: config.ACCESS_TOKEN_EXPIRATION,
      refreshTokenSecret: config.REFRESH_TOKEN_SECRET,
      refreshTokenExpiration: config.REFRESH_TOKEN_EXPIRATION,
    }),
    // ... 其他模块
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // ... 其他守卫
  ],
})
export class AppModule {}
```

#### 步骤 3：更新导入

使用查找替换工具批量更新导入路径：

```bash
# 查找所有导入
find apps/iam-api/src -name "*.ts" -exec grep -l "@/common/guards" {} \;

# 手动或使用脚本替换
# @/common/guards -> @hl8/auth/guards
# @/common/decorators -> @hl8/auth/decorators
```

#### 步骤 4：处理 JwtRefreshGuard

如果使用 `JwtRefreshGuard`，需要提供会话验证器：

```typescript
// 创建会话验证器
@Injectable()
export class SessionVerifierService implements SessionVerifier {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: EntityRepository<Session>,
  ) {}

  async verifySession(token: string, userId: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      refresh_token: token,
      user: userId,
    });
    return !!session;
  }
}

// 在模块中注册
@Module({
  providers: [
    {
      provide: SESSION_VERIFIER,
      useClass: SessionVerifierService,
    },
  ],
})
export class AuthModule {}
```

#### 步骤 5：测试验证

1. 运行单元测试
2. 运行集成测试
3. 手动测试认证流程

---

## 风险评估

### 技术风险

| 风险       | 影响 | 概率 | 缓解措施               |
| ---------- | ---- | ---- | ---------------------- |
| 类型不兼容 | 高   | 中   | 充分测试，提供类型定义 |
| 性能下降   | 中   | 低   | 性能测试，保持实现不变 |
| 依赖冲突   | 中   | 低   | 使用 peerDependencies  |
| 配置错误   | 中   | 中   | 提供默认值和验证       |

### 业务风险

| 风险       | 影响 | 概率 | 缓解措施           |
| ---------- | ---- | ---- | ------------------ |
| 功能回归   | 高   | 低   | 全面测试，逐步迁移 |
| 部署问题   | 中   | 低   | 灰度发布，回滚方案 |
| 文档不完整 | 低   | 中   | 完善文档和示例     |

### 风险应对

1. **分阶段迁移**：先在开发环境验证，再部署到生产
2. **保留旧代码**：迁移期间保留旧代码作为回退方案
3. **充分测试**：单元测试、集成测试、E2E 测试
4. **文档完善**：提供详细的迁移指南和 API 文档

---

## 测试策略

### 单元测试

#### 守卫测试

```typescript
describe('JwtAuthGuard', () => {
  it('应该允许公共路由访问', async () => {
    // 测试 @Public() 装饰器
  });

  it('应该拒绝无效令牌', async () => {
    // 测试令牌验证
  });
});

describe('RolesGuard', () => {
  it('应该允许匹配的角色访问', () => {
    // 测试角色匹配
  });

  it('应该允许 SUPERADMIN 访问所有路由', () => {
    // 测试特殊角色
  });
});
```

#### 装饰器测试

```typescript
describe('@Public', () => {
  it('应该设置正确的元数据', () => {
    // 测试元数据设置
  });
});
```

### 集成测试

在 `iam-api` 中测试完整流程：

```typescript
describe('Auth Integration', () => {
  it('应该完成完整的登录流程', async () => {
    // 测试登录 -> 获取令牌 -> 访问受保护资源
  });
});
```

### 测试覆盖率目标

- 守卫：≥ 90%
- 装饰器：≥ 85%
- 模块：≥ 80%
- 整体：≥ 80%

---

## 后续规划

### 短期（1-2 周）

1. ✅ 完成库创建和代码迁移
2. ✅ 完成 iam-api 适配
3. ✅ 完善文档和测试

### 中期（1-2 月）

1. 支持 CASL 权限策略（根据项目章程要求）
2. 支持多种认证策略（JWT、Session、OAuth）
3. 提供更多装饰器和工具函数

### 长期（3-6 月）

1. 支持多租户认证
2. 支持单点登录（SSO）
3. 提供认证中间件和拦截器
4. 性能优化和监控支持

---

## 总结

本次重构将认证和权限管理功能从应用层抽取为独立的 `@hl8/auth` 库，提供：

- ✅ **可复用性**：供其他 NestJS 项目使用
- ✅ **标准化**：统一的认证和权限接口
- ✅ **可扩展性**：支持自定义配置和实现
- ✅ **向后兼容**：现有代码最小改动
- ✅ **类型安全**：完整的 TypeScript 支持

重构采用分阶段实施策略，降低风险，确保平稳过渡。

---

## 附录

### A. 参考文档

- [NestJS 动态模块](https://docs.nestjs.com/fundamentals/dynamic-modules)
- [NestJS 守卫](https://docs.nestjs.com/guards)
- [TypeScript 泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)

### B. 相关依赖

- `@nestjs/common` - NestJS 核心
- `@nestjs/jwt` - JWT 支持
- `@hl8/config` - 配置管理
- `@hl8/exceptions` - 异常定义

### C. 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issue：创建 GitHub Issue
- 代码审查：提交 Pull Request

---

**文档结束**
