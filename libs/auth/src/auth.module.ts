import {
  DynamicModule,
  InjectionToken,
  Module,
  ModuleMetadata,
  OptionalFactoryDependency,
  Provider,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_CONFIG } from './constants/auth-tokens.constants.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import type { AuthConfig } from './interfaces/auth-config.interface.js';

/**
 * 认证模块，提供 JWT 认证和权限管理功能。
 *
 * @description 动态全局模块，用于配置认证功能。提供守卫和装饰器供应用使用。
 * 支持通过 `forRoot()` 方法传入配置，也可以通过 `forRootAsync()` 方法异步加载配置。
 *
 * **全局模块特性**：
 * - 标记为 `global: true`，守卫和依赖在所有模块中自动可用
 * - 守卫（`JwtAuthGuard`、`JwtRefreshGuard`、`RolesGuard`）可以在任何模块中使用，无需额外配置
 * - `AUTH_CONFIG` 和 `JwtService` 在所有模块中自动可用
 * - 配置只需在 `AppModule` 中提供一次
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [
 *     AuthModule.forRoot({
 *       accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
 *       accessTokenExpiration: '15m',
 *       refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
 *       refreshTokenExpiration: '7d',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 异步配置（推荐）
 * @Module({
 *   imports: [
 *     AuthModule.forRootAsync({
 *       inject: [ConfigService],
 *       useFactory: (config: ConfigService) => ({
 *         accessTokenSecret: config.get('ACCESS_TOKEN_SECRET'),
 *         accessTokenExpiration: config.get('ACCESS_TOKEN_EXPIRATION'),
 *         refreshTokenSecret: config.get('REFRESH_TOKEN_SECRET'),
 *         refreshTokenExpiration: config.get('REFRESH_TOKEN_EXPIRATION'),
 *       }),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 在其他模块中使用守卫（无需额外配置）
 * @Controller('auth')
 * export class AuthController {
 *   @UseGuards(JwtRefreshGuard) // 直接使用，无需导入或提供
 *   @Post('refresh')
 *   refreshToken() {}
 * }
 * ```
 */
@Module({})
export class AuthModule {
  /**
   * 同步配置认证模块。
   *
   * @description 创建全局认证模块并注册认证配置提供者。
   * 守卫和依赖在所有模块中自动可用，无需额外配置。
   *
   * @param {AuthConfig} config - 认证配置。
   * @returns {DynamicModule} 动态全局模块定义。
   */
  static forRoot(config: AuthConfig): DynamicModule {
    const configProvider: Provider = {
      provide: AUTH_CONFIG,
      useValue: config,
    };

    return {
      module: AuthModule,
      // 导入 JwtModule 以确保 JwtService 在模块上下文中可用
      // 标记为 global: true 以确保 JwtService 在所有模块中可用
      imports: [JwtModule.register({ global: true })],
      providers: [configProvider, JwtAuthGuard, JwtRefreshGuard, RolesGuard],
      // 导出守卫、配置和 JwtService，使它们可以在所有模块中使用
      exports: [
        JwtAuthGuard,
        JwtRefreshGuard,
        RolesGuard,
        AUTH_CONFIG,
        JwtModule, // 导出 JwtModule，它自动导出 JwtService
        // 注意：不能直接导出 JwtService，因为它是 JwtModule 提供的
        // 导出 JwtModule 即可，它已经标记为 global: true
      ],
      global: true, // 改为全局模块，使守卫和依赖在所有模块中自动可用
    };
  }

  /**
   * 异步配置认证模块。
   *
   * @description 创建全局认证模块并异步注册认证配置提供者。
   * 支持从其他模块（如 ConfigModule）注入依赖。
   * 守卫和依赖在所有模块中自动可用，无需额外配置。
   *
   * @param {Pick<ModuleMetadata, 'imports'> & { useFactory: (...args: any[]) => AuthConfig | Promise<AuthConfig>; inject?: any[] }} options - 异步配置选项。
   * @returns {DynamicModule} 动态全局模块定义。
   */
  static forRootAsync(options: {
    imports?: ModuleMetadata['imports'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory: (...args: any[]) => AuthConfig | Promise<AuthConfig>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
  }): DynamicModule {
    const configProvider: Provider = {
      provide: AUTH_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: AuthModule,
      // 导入 JwtModule 以确保 JwtService 在模块上下文中可用
      // 标记为 global: true 以确保 JwtService 在所有模块中可用
      imports: [
        JwtModule.register({ global: true }),
        ...(options.imports || []),
      ],
      providers: [configProvider, JwtAuthGuard, JwtRefreshGuard, RolesGuard],
      // 导出守卫、配置和 JwtService，使它们可以在所有模块中使用
      exports: [
        JwtAuthGuard,
        JwtRefreshGuard,
        RolesGuard,
        AUTH_CONFIG,
        JwtModule, // 导出 JwtModule，它自动导出 JwtService
        // 注意：不能直接导出 JwtService，因为它是 JwtModule 提供的
        // 导出 JwtModule 即可，它已经标记为 global: true
      ],
      global: true, // 改为全局模块，使守卫和依赖在所有模块中自动可用
    };
  }
}
