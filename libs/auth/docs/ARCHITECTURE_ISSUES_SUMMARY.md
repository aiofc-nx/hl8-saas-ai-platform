# libs/auth 结构性问题和解决方案

## 核心问题

**问题**：`JwtRefreshGuard` 在 `AuthModule` 中无法解析 `JwtService` 依赖。

**根本原因**：NestJS 动态模块的限制

- `Hl8AuthModule` 是通过 `forRootAsync()` 在 `AppModule` 中动态创建的
- 在子模块（`AuthModule`）中，不能直接导入动态模块的类来访问其实例
- 守卫作为类被导出，但在使用它们的模块中实例化时，需要在该模块的上下文中解析依赖

## 当前架构缺陷

1. **动态模块实例化问题**：动态模块实例只在创建它的上下文中可用
2. **守卫的依赖注入冲突**：守卫依赖的提供者（`JwtService`、`AUTH_CONFIG`）需要在每个使用守卫的模块中重新配置
3. **模块作用域隔离**：NestJS 的模块系统是作用域隔离的，除非显式导出和导入

## 临时解决方案（当前使用）

在 `AuthModule` 中：

1. 导入 `JwtModule.register({})` 以确保 `JwtService` 在模块上下文中可用
2. 重新提供 `JwtRefreshGuard` 和 `AUTH_CONFIG`
3. 提供 `SESSION_VERIFIER`（通过 `SessionVerifierProvider`）

**缺点**：

- 配置重复
- 维护成本高
- 容易出错

## 推荐长期解决方案

### 方案 1：使 Hl8AuthModule 成为全局模块（推荐）

修改 `libs/auth/src/auth.module.ts`：

```typescript
return {
  module: AuthModule,
  imports: [JwtModule.register({ global: true })],
  providers: [configProvider, JwtAuthGuard, JwtRefreshGuard, RolesGuard],
  exports: [
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    AUTH_CONFIG,
    JwtModule,
    JwtService,
  ],
  global: true, // 添加全局标记
};
```

**优点**：

- 守卫和依赖在所有模块中自动可用
- 配置只需在 `AppModule` 中提供一次
- 符合 NestJS 的最佳实践

**缺点**：

- 所有提供者都在全局范围内，可能导致命名冲突（但可以通过命名空间避免）

### 方案 2：重构为两个模块

将 `Hl8AuthModule` 拆分为：

1. `AuthCoreModule`：提供配置和 `JwtService`（全局模块）
2. `AuthGuardsModule`：提供守卫（可选模块）

**优点**：

- 清晰的职责分离
- 更好的可复用性

**缺点**：

- 需要重构现有代码

## 已实施的解决方案

已成功实施全局模块方案：

### 1. Hl8AuthModule 改为全局模块

- ✅ 修改 `forRoot()` 和 `forRootAsync()` 方法，设置 `global: true`
- ✅ `JwtModule.register({ global: true })` 确保 `JwtService` 全局可用
- ✅ 显式导出 `JwtService`，确保所有模块可以访问
- ✅ 更新 JSDoc 注释，说明全局模块特性

### 2. 清理应用模块中的重复配置

- ✅ 从 `apps/iam-api/src/features/auth/auth.module.ts` 移除 `JwtModule` 导入
- ✅ 移除 `JwtModule.register({})` 从 imports 数组
- ✅ 移除 `JwtRefreshGuard` 导入和提供者
- ✅ 移除 `AUTH_CONFIG` 导入和提供者
- ✅ 保留 `SessionVerifierProvider`（应用特定的 `SESSION_VERIFIER` 实现）

### 3. 使用说明

**在应用模块中使用守卫（无需额外配置）**：

```typescript
import { JwtRefreshGuard } from '@hl8/auth/guards';

@Controller('auth')
export class AuthController {
  @UseGuards(JwtRefreshGuard) // 直接使用，无需导入或提供
  @Post('refresh')
  refreshToken() {}
}
```

**配置只需在 `AppModule` 中提供一次**：

```typescript
@Module({
  imports: [
    Hl8AuthModule.forRootAsync({
      inject: [EnvConfig],
      useFactory: (config: EnvConfig) => ({
        accessTokenSecret: config.ACCESS_TOKEN_SECRET,
        accessTokenExpiration: config.ACCESS_TOKEN_EXPIRATION,
        refreshTokenSecret: config.REFRESH_TOKEN_SECRET,
        refreshTokenExpiration: config.REFRESH_TOKEN_EXPIRATION,
      }),
    }),
  ],
})
export class AppModule {}
```

## 效果验证

1. ✅ 依赖注入问题已解决：守卫可以在任何模块中使用，无需额外配置
2. ✅ 代码已简化：移除应用模块中的重复配置
3. ✅ 维护性提升：配置只需在 `AppModule` 中提供一次
4. ✅ 符合最佳实践：全局模块是 NestJS 推荐的解决方案
