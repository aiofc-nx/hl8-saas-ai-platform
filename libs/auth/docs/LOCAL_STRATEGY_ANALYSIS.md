# 本地策略（Local Strategy）支持分析

**分析日期**：2025-01-XX  
**当前状态**：`@hl8/auth` 仅支持 JWT 认证守卫  
**问题**：是否需要添加本地策略（用户名/密码登录）支持？

---

## 执行摘要

### 当前架构

**JWT 守卫**（已实现）：

- ✅ 验证已签发的 JWT 令牌
- ✅ 从 `Authorization: Bearer <token>` 头提取令牌
- ✅ 用于保护需要认证的路由

**登录逻辑**（应用层实现）：

- ✅ 在 `iam-api` 的 `AuthService` 中实现
- ✅ 验证用户名/密码
- ✅ 生成 JWT 令牌

### 是否需要本地策略？

**答案**：**当前架构已经足够，但可以添加 LocalAuthGuard 作为可选项**

**理由**：

1. ✅ 当前架构工作良好（登录在应用层，JWT 守卫在库层）
2. ✅ 添加 LocalAuthGuard 可以提供统一性
3. ✅ 可以作为可选的增强功能

---

## 1. 当前架构分析

### 当前登录流程

```
客户端请求
  ↓
POST /auth/sign-in (标记为 @Public())
  ↓
AuthController.signIn()
  ↓
AuthService.signIn()
  ├── 验证用户名/密码 (validateUser)
  ├── 生成 JWT 令牌 (generateTokens)
  └── 创建会话
  ↓
返回 JWT 令牌
```

### 当前架构特点

**优点**：

1. ✅ **职责分离**
   - 登录逻辑在应用层（灵活、可定制）
   - JWT 验证在库层（可复用）

2. ✅ **灵活性**
   - 应用层可以自定义登录逻辑
   - 可以添加额外的验证（如设备信息、IP 检查等）

3. ✅ **简单直接**
   - 登录端点是公开的（`@Public()`）
   - 不需要额外的守卫层

**缺点**：

1. ⚠️ **登录逻辑分散**
   - 登录逻辑在应用层，而不是库层
   - 不同的应用需要重复实现登录逻辑

2. ⚠️ **缺少统一性**
   - 不同应用的登录实现可能不一致
   - 难以在库层提供统一的登录功能

---

## 2. 什么是本地策略（Local Strategy）？

### Passport 中的本地策略

在 Passport 中，本地策略指的是：

```typescript
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      // 验证用户名/密码
      const user = await validateUser(email, password);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    },
  ),
);
```

**特点**：

- 从请求体提取用户名/密码
- 验证凭据
- 设置用户对象到请求中
- 用于登录端点

### 在 NestJS 中的实现

**使用 Passport**：

```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

@UseGuards(AuthGuard('local'))
@Post('login')
async login(@Request() req) {
  // req.user 已由守卫设置
  return this.authService.login(req.user);
}
```

**自定义实现（当前架构）**：

```typescript
@Public()
@Post('sign-in')
async signIn(@Body() dto: SignInUserDto) {
  // 直接调用服务验证
  return this.authService.signIn(dto);
}
```

---

## 3. 当前实现 vs 本地策略

### 方案 1：当前架构（推荐保持）✅

**流程**：

```typescript
// 应用层
@Public()
@Post('sign-in')
async signIn(@Body() dto: SignInUserDto) {
  // 服务层验证
  const user = await this.authService.validateUser(dto);
  // 生成令牌
  const tokens = await this.authService.generateTokens(user);
  return { user, tokens };
}
```

**优点**：

- ✅ 简单直接
- ✅ 完全控制登录流程
- ✅ 易于自定义（添加设备信息、IP 检查等）
- ✅ 错误处理更灵活
- ✅ 可以返回额外的响应数据

**缺点**：

- ⚠️ 登录逻辑在应用层，不是库层
- ⚠️ 不同应用需要重复实现

### 方案 2：添加 LocalAuthGuard

**流程**：

```typescript
// 库层提供守卫
@UseGuards(LocalAuthGuard)
@Post('sign-in')
async signIn(@Request() req) {
  // req.user 已由守卫设置
  const tokens = await this.authService.generateTokens(req.user);
  return { user: req.user, tokens };
}
```

**优点**：

- ✅ 统一登录接口
- ✅ 登录逻辑在库层
- ✅ 更符合 Passport 模式
- ✅ 可以在库层提供统一的验证逻辑

**缺点**：

- ⚠️ 增加复杂性
- ⚠️ 需要注入用户验证服务
- ⚠️ 灵活性降低（难以添加自定义验证）

---

## 4. 是否需要添加本地策略？

### 评估标准

| 因素         | 当前架构   | 添加 LocalAuthGuard | 推荐              |
| ------------ | ---------- | ------------------- | ----------------- |
| **简单性**   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐              | 当前架构 ✅       |
| **灵活性**   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐              | 当前架构 ✅       |
| **统一性**   | ⭐⭐⭐     | ⭐⭐⭐⭐⭐          | LocalAuthGuard ✅ |
| **可复用性** | ⭐⭐⭐     | ⭐⭐⭐⭐⭐          | LocalAuthGuard ✅ |
| **维护成本** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐            | 当前架构 ✅       |

### 结论

**建议**：**保持当前架构，但提供 LocalAuthGuard 作为可选功能**

**理由**：

1. **当前架构已满足需求**
   - 登录逻辑简单直接
   - 灵活性高，易于自定义

2. **添加 LocalAuthGuard 作为可选项**
   - 提供统一的登录守卫
   - 需要统一登录逻辑的应用可以使用
   - 需要灵活性的应用可以继续使用当前方式

3. **渐进式增强**
   - 不破坏现有实现
   - 向后兼容
   - 可以根据需求选择使用

---

## 5. 实现建议：添加 LocalAuthGuard（可选）

### 设计目标

1. ✅ **可选功能**：不影响现有代码
2. ✅ **可配置**：支持自定义验证逻辑
3. ✅ **类型安全**：完整的 TypeScript 支持
4. ✅ **灵活性**：可以注入自定义验证服务

### 实现方案

#### 5.1 创建用户验证器接口

```typescript
// src/interfaces/user-validator.interface.ts
export interface UserValidator<T = unknown> {
  /**
   * 验证用户凭据。
   *
   * @param identifier - 用户标识符（邮箱或用户名）
   * @param password - 用户密码
   * @returns 如果验证成功，返回用户对象；否则返回 null
   */
  validateUser(identifier: string, password: string): Promise<T | null>;
}

export const USER_VALIDATOR = 'USER_VALIDATOR';
```

#### 5.2 创建 LocalAuthGuard

````typescript
// src/guards/local-auth.guard.ts
import { GeneralUnauthorizedException } from '@hl8/exceptions';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Request } from 'express';
import {
  USER_VALIDATOR,
  UserValidator,
} from '../interfaces/user-validator.interface.js';

/**
 * 本地认证守卫，用于验证用户名/密码。
 *
 * @description 从请求体中提取用户名和密码，使用 UserValidator 验证凭据。
 * 验证成功后，将用户对象附加到请求对象。
 *
 * @example
 * ```typescript
 * @UseGuards(LocalAuthGuard)
 * @Post('sign-in')
 * async signIn(@Request() req) {
 *   // req.user 已由守卫设置
 *   return this.authService.login(req.user);
 * }
 * ```
 */
@Injectable()
export class LocalAuthGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject(USER_VALIDATOR)
    private userValidator?: UserValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.userValidator) {
      throw new Error(
        'LocalAuthGuard 需要提供 UserValidator。请在 AuthModule 中注册 USER_VALIDATOR 提供者。',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { username, password, email, identifier } = request.body || {};

    // 支持多种字段名：username, email, identifier
    const userIdentifier = username || email || identifier;

    if (!userIdentifier || !password) {
      throw new GeneralUnauthorizedException(
        '缺少用户名或密码',
        'MISSING_CREDENTIALS',
      );
    }

    const user = await this.userValidator.validateUser(
      userIdentifier,
      password,
    );

    if (!user) {
      throw new GeneralUnauthorizedException(
        '用户名或密码错误',
        'INVALID_CREDENTIALS',
      );
    }

    request.user = user;
    return true;
  }
}
````

#### 5.3 更新 AuthConfig

```typescript
// src/interfaces/auth-config.interface.ts
export interface AuthConfig {
  // ... 现有配置

  /**
   * 可选：本地认证配置。
   */
  localAuth?: {
    /**
     * 用户名字段名，默认为 'username'。
     */
    usernameField?: string;

    /**
     * 密码字段名，默认为 'password'。
     */
    passwordField?: string;

    /**
     * 支持的用户名字段，默认为 ['username', 'email', 'identifier']。
     */
    usernameFields?: string[];
  };
}
```

#### 5.4 更新 AuthModule

```typescript
// src/auth.module.ts
export class AuthModule {
  static forRoot(config: AuthConfig): DynamicModule {
    // ... 现有代码

    return {
      module: AuthModule,
      providers: [
        configProvider,
        JwtAuthGuard,
        JwtRefreshGuard,
        RolesGuard,
        // LocalAuthGuard 是可选的，需要在应用层提供 UserValidator
      ],
      exports: [
        JwtAuthGuard,
        JwtRefreshGuard,
        RolesGuard,
        LocalAuthGuard, // 导出但不强制使用
        AUTH_CONFIG,
      ],
      global: false,
    };
  }
}
```

#### 5.5 使用示例

```typescript
// apps/iam-api/src/features/auth/local-user-validator.service.ts
import { Injectable } from '@nestjs/common';
import { USER_VALIDATOR, UserValidator } from '@hl8/auth';
import { AuthService } from './auth.service';
import { User } from '@/features/users/entities/user.entity';

@Injectable()
export class LocalUserValidatorService implements UserValidator<User> {
  constructor(private authService: AuthService) {}

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    try {
      const user = await this.authService.validateUser({
        identifier,
        password,
      });
      return user;
    } catch {
      return null;
    }
  }
}

// apps/iam-api/src/features/auth/auth.module.ts
import { USER_VALIDATOR } from '@hl8/auth';
import { LocalUserValidatorService } from './local-user-validator.service';

@Module({
  providers: [
    AuthService,
    LocalUserValidatorService,
    {
      provide: USER_VALIDATOR,
      useClass: LocalUserValidatorService,
    },
  ],
})
export class AuthModule {}

// apps/iam-api/src/features/auth/auth.controller.ts
import { LocalAuthGuard } from '@hl8/auth';

@Controller('auth')
export class AuthController {
  // 方案 1：使用 LocalAuthGuard（新的）
  @UseGuards(LocalAuthGuard)
  @Post('sign-in-v2')
  async signInV2(@Request() req, @Body() _dto: SignInUserDto) {
    // req.user 已由守卫设置
    const tokens = await this.authService.generateTokens(req.user);
    return { user: req.user, tokens };
  }

  // 方案 2：当前实现（保持兼容）
  @Public()
  @Post('sign-in')
  async signIn(@Body() signInUserDto: SignInUserDto) {
    const data = await this.authService.signIn(signInUserDto);
    return data;
  }
}
```

---

## 6. 对比总结

### 架构对比

| 特性           | 当前架构 | LocalAuthGuard | 推荐              |
| -------------- | -------- | -------------- | ----------------- |
| **实现复杂度** | 简单     | 中等           | 当前架构 ✅       |
| **灵活性**     | 高       | 中             | 当前架构 ✅       |
| **统一性**     | 低       | 高             | LocalAuthGuard ✅ |
| **可复用性**   | 中       | 高             | LocalAuthGuard ✅ |
| **类型安全**   | 高       | 高             | 两者 ✅           |
| **向后兼容**   | ✅       | ✅             | 两者 ✅           |

### 使用场景

#### 当前架构适合：

- ✅ 需要灵活的自定义登录逻辑
- ✅ 需要在登录时添加额外验证（设备信息、IP 检查等）
- ✅ 登录响应需要包含额外数据
- ✅ 需要完全控制错误处理

#### LocalAuthGuard 适合：

- ✅ 需要统一的登录接口
- ✅ 多个应用需要共享登录逻辑
- ✅ 希望登录逻辑在库层
- ✅ 更符合标准认证模式

---

## 7. 最终建议

### 推荐方案：渐进式增强

**阶段 1：保持当前架构（当前）**

- ✅ 继续使用当前实现
- ✅ 保持简单和灵活

**阶段 2：添加 LocalAuthGuard 作为可选功能（未来）**

- ✅ 提供统一的登录守卫
- ✅ 不影响现有代码
- ✅ 需要统一性的应用可以使用

**阶段 3：根据需求选择**

- ✅ 新应用可以选择使用 LocalAuthGuard
- ✅ 现有应用可以继续使用当前方式
- ✅ 两者可以共存

### 实施优先级

**优先级 1：保持当前架构** ✅

- 当前架构工作良好
- 满足所有需求
- 不需要立即修改

**优先级 2：添加 LocalAuthGuard（可选）** 🔄

- 如果需要统一性，可以添加
- 作为可选功能，不影响现有代码
- 需要时可以逐步迁移

---

## 8. 结论

### 回答核心问题

**Q: 当前的 JWT 能否支持本地策略？**

**A: 当前架构已经支持用户名/密码登录，但不是在守卫层面，而是在服务层面。**

**当前状态**：

- ✅ 支持用户名/密码登录（在应用层 `AuthService`）
- ✅ JWT 守卫验证令牌（在库层）
- ✅ 架构清晰，职责分离

**是否需要添加 LocalAuthGuard？**

**建议**：

- **当前不需要**：现有架构已满足需求
- **未来可考虑**：如果需要统一登录逻辑，可以添加
- **作为可选功能**：不影响现有代码，需要时可以使用

### 关键要点

1. ✅ **当前架构已足够**
   - 登录逻辑在应用层（灵活）
   - JWT 验证在库层（可复用）

2. ✅ **可以添加 LocalAuthGuard 作为可选功能**
   - 提供统一的登录守卫
   - 不影响现有代码
   - 需要统一性的应用可以使用

3. ✅ **渐进式增强**
   - 不破坏现有实现
   - 向后兼容
   - 可以根据需求选择使用

---

## 附录：实现示例

如果需要实现 LocalAuthGuard，可以参考以下代码：

详细实现代码请参考第 5 节的实现方案。

---

**分析完成日期**：2025-01-XX  
**建议**：保持当前架构，未来如需统一性再考虑添加 LocalAuthGuard
