# @hl8/auth

NestJS 认证与权限管理模块，提供 JWT 认证、角色权限控制和相关装饰器。

## 功能概述

- JWT 认证守卫（`JwtAuthGuard`）- 验证访问令牌
- JWT 刷新令牌守卫（`JwtRefreshGuard`）- 验证刷新令牌（可选会话验证）
- 基于角色的权限守卫（`RolesGuard`）- 基于角色的访问控制
- 认证装饰器（`@Public`、`@Roles`、`@User`）- 简化认证和权限控制
- 类型安全 - 完整的 TypeScript 类型定义
- 可配置 - 支持自定义配置和扩展

## 快速上手

### 1. 安装依赖

```bash
pnpm add @hl8/auth
```

### 2. 配置认证模块

在应用根模块中导入并配置 `AuthModule`：

```typescript
import { AuthModule, JwtAuthGuard, RolesGuard } from '@hl8/auth';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    AuthModule.forRoot({
      accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
      accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
      refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
      refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
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
  ],
})
export class AppModule {}
```

### 3. 使用装饰器

#### 标记公共路由

```typescript
import { Public } from '@hl8/auth/decorators';
import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login() {
    // 此路由不需要认证
  }
}
```

#### 基于角色的访问控制

```typescript
import { Roles } from '@hl8/auth/decorators';
import { Controller, Get, Delete } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Roles('ADMIN')
  @Get('dashboard')
  getDashboard() {
    // 只有 ADMIN 角色可以访问
  }

  @Roles('ADMIN', 'USER')
  @Get('profile')
  getProfile() {
    // ADMIN 或 USER 都可以访问
  }
}
```

#### 获取当前用户

```typescript
import { User } from '@hl8/auth/decorators';
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile(@User() user: { id: string; username: string; email: string }) {
    return user;
  }
}
```

### 4. 使用刷新令牌守卫（可选）

如果需要在刷新令牌时验证会话，可以实现 `SessionVerifier` 接口：

```typescript
import { Injectable } from '@nestjs/common';
import { SessionVerifier } from '@hl8/auth/interfaces';
import { EntityRepository } from '@mikro-orm/postgresql';

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

## API 文档

### 守卫

#### JwtAuthGuard

验证 JWT 访问令牌的守卫。自动从 `Authorization` 头提取 Bearer 令牌并验证。

#### JwtRefreshGuard

验证 JWT 刷新令牌的守卫。支持可选的会话验证器。

#### RolesGuard

基于角色的访问控制守卫。检查用户角色是否匹配所需角色。

### 装饰器

#### @Public()

标记路由为公共路由，绕过认证检查。

#### @Roles(...roles)

指定路由所需的角色。用户需要拥有其中一个角色才能访问。

#### @User()

从请求中提取已认证的用户信息。

## 配置选项

### AuthConfig

```typescript
interface AuthConfig {
  accessTokenSecret: string;
  accessTokenExpiration: string | number;
  refreshTokenSecret: string;
  refreshTokenExpiration: string | number;
  extractUserFromPayload?: (payload: any) => any;
}
```

## 许可证

MIT
