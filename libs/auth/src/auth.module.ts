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
 * @description 动态模块，用于配置认证功能。提供守卫和装饰器供应用使用。
 * 支持通过 `forRoot()` 方法传入配置，也可以通过 `forRootAsync()` 方法异步加载配置。
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
 * // 异步配置
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
 * ```
 */
@Module({})
export class AuthModule {
  /**
   * 同步配置认证模块。
   *
   * @description 创建认证模块并注册认证配置提供者。
   * 同时导出守卫供应用使用。
   *
   * @param {AuthConfig} config - 认证配置。
   * @returns {DynamicModule} 动态模块定义。
   */
  static forRoot(config: AuthConfig): DynamicModule {
    const configProvider: Provider = {
      provide: AUTH_CONFIG,
      useValue: config,
    };

    return {
      module: AuthModule,
      // 导入 JwtModule 以确保 JwtService 在模块上下文中可用
      // 即使应用层配置了全局 JwtModule，这里也需要导入才能在模块内部使用
      // 注意：JwtModule.register({}) 会创建一个新的模块实例，但与全局实例共享相同的 JwtService 提供者
      imports: [JwtModule.register({})],
      providers: [configProvider, JwtAuthGuard, JwtRefreshGuard, RolesGuard],
      exports: [JwtAuthGuard, JwtRefreshGuard, RolesGuard, AUTH_CONFIG],
      global: false,
    };
  }

  /**
   * 异步配置认证模块。
   *
   * @description 创建认证模块并异步注册认证配置提供者。
   * 支持从其他模块（如 ConfigModule）注入依赖。
   *
   * @param {Pick<ModuleMetadata, 'imports'> & { useFactory: (...args: any[]) => AuthConfig | Promise<AuthConfig>; inject?: any[] }} options - 异步配置选项。
   * @returns {DynamicModule} 动态模块定义。
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
      // 即使应用层配置了全局 JwtModule，这里也需要导入才能在模块内部使用
      // 注意：JwtModule.register({}) 会创建一个新的模块实例，但与全局实例共享相同的 JwtService 提供者
      imports: [JwtModule.register({}), ...(options.imports || [])],
      providers: [configProvider, JwtAuthGuard, JwtRefreshGuard, RolesGuard],
      exports: [JwtAuthGuard, JwtRefreshGuard, RolesGuard, AUTH_CONFIG],
      global: false,
    };
  }
}
