import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

/**
 * @public
 * @description `ApplicationCoreModule` 注册选项。
 */
export interface ApplicationCoreModuleOptions {
  /**
   * @description 额外需要注册的应用层提供者。
   */
  readonly extraProviders?: Provider[];
}

/**
 * @public
 * @description 应用层核心模块，提供 CQRS 基础设施。
 * @remarks 权限校验和审计能力已迁移到 `@hl8/auth`，请使用 `AuthApplicationModule` 注册相关组件。
 *
 * ## 使用场景
 *
 * ### 何时使用 ApplicationCoreModule
 *
 * 适合以下场景：
 * - ✅ **基础 CQRS**：只需要 CQRS 基础设施，不需要权限和审计
 * - ✅ **自定义实现**：需要自定义权限和审计实现
 *
 * ### 何时使用 AuthApplicationModule
 *
 * 适合以下场景：
 * - ✅ **标准应用**：需要完整的权限校验和审计能力
 * - ✅ **快速接入**：希望在 1 个工作日内完成接入
 * - ✅ **团队规范**：遵循平台统一的认证权限能力
 *
 * @example
 * ```typescript
 * // 只注册 CQRS 基础设施
 * @Module({
 *   imports: [
 *     ApplicationCoreModule.register(),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 注册 CQRS 基础设施和额外提供者
 * @Module({
 *   imports: [
 *     ApplicationCoreModule.register({
 *       extraProviders: [MyCustomProvider],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ApplicationCoreModule {
  /**
   * @description 注册应用层核心能力。
   * @param options - 模块配置选项
   * @returns 动态模块
   */
  public static register(
    options: ApplicationCoreModuleOptions = {},
  ): DynamicModule {
    const { extraProviders } = options;

    const providers: Provider[] = [];
    const exports: Array<string | symbol | Type<unknown>> = [];

    // 额外提供者
    if (extraProviders?.length) {
      providers.push(...extraProviders);
    }

    return {
      module: ApplicationCoreModule,
      global: true,
      imports: [CqrsModule],
      providers,
      exports,
    };
  }
}
