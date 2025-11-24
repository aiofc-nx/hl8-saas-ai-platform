import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CaslAbilityCoordinator } from './casl/casl-ability-coordinator.js';
import { ABILITY_SERVICE_TOKEN } from './interfaces/tokens.js';

/**
 * @public
 * @description `AuthApplicationModule` 注册选项。
 */
export interface AuthApplicationModuleOptions {
  /**
   * @description 权限服务提供者（必须 provide 为 `ABILITY_SERVICE_TOKEN`）。
   * @remarks 如果提供了此选项且 `enableAbility` 不为 false，则注册权限相关组件。
   */
  readonly abilityService?: Provider;

  /**
   * @description 是否启用权限相关组件。
   * @remarks 默认值：如果提供了 `abilityService` 则为 true，否则为 false。
   * 如果为 false，则不注册 `CaslAbilityCoordinator`。
   */
  readonly enableAbility?: boolean;

  /**
   * @description 额外需要注册的提供者。
   */
  readonly extraProviders?: Provider[];
}

/**
 * @public
 * @description 认证权限应用层模块，集中注册权限相关组件。
 *
 * ## 使用场景
 *
 * ### 何时使用 AuthApplicationModule
 *
 * 适合以下场景：
 * - ✅ **标准应用**：需要完整的权限校验能力
 * - ✅ **快速接入**：希望在 1 个工作日内完成接入
 * - ✅ **团队规范**：遵循平台统一的认证权限能力
 *
 * ## 组件说明
 *
 * ### 权限相关组件
 * - `CaslAbilityCoordinator`：权限协调器，统一校验命令与查询执行权限
 * - `abilityService`：权限服务，提供权限能力解析
 *
 * ## 依赖关系
 *
 * - 如果启用权限，必须提供 `abilityService`
 *
 * @example
 * ```typescript
 * // 注册权限相关组件
 * @Module({
 *   imports: [
 *     AuthApplicationModule.register({
 *       abilityService: { provide: ABILITY_SERVICE_TOKEN, useClass: IamAbilityService },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class AuthApplicationModule {
  /**
   * @description 注册认证权限应用层能力。
   * @param options - 模块配置选项
   * @returns 动态模块
   */
  public static register(
    options: AuthApplicationModuleOptions = {},
  ): DynamicModule {
    const {
      abilityService,
      enableAbility = !!abilityService,
      extraProviders,
    } = options;

    const providers: Provider[] = [];
    const exports: Array<string | symbol | Type<unknown>> = [];

    // 权限相关组件
    if (enableAbility) {
      providers.push(CaslAbilityCoordinator);
      exports.push(CaslAbilityCoordinator, ABILITY_SERVICE_TOKEN);
      if (abilityService) {
        providers.push(abilityService);
      }
    }

    // 额外提供者
    if (extraProviders?.length) {
      providers.push(...extraProviders);
    }

    return {
      module: AuthApplicationModule,
      global: true,
      imports: [CqrsModule],
      providers,
      exports,
    };
  }
}
