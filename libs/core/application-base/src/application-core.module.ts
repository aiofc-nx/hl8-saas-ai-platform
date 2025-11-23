import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuditCommandInterceptor } from './audit/audit-command.interceptor.js';
import { AuditCoordinator } from './audit/audit-coordinator.js';
import { AuditQueryInterceptor } from './audit/audit-query.interceptor.js';
import { CaslAbilityCoordinator } from './casl/casl-ability-coordinator.js';
import {
  ABILITY_SERVICE_TOKEN,
  AUDIT_SERVICE_TOKEN,
} from './interfaces/tokens.js';

/**
 * @public
 * @description `ApplicationCoreModule` 注册选项。
 *
 * ## 使用场景
 *
 * ### 注册所有组件（默认）
 * ```typescript
 * ApplicationCoreModule.register({
 *   abilityService: { provide: ABILITY_SERVICE_TOKEN, useClass: IamAbilityService },
 *   auditService: { provide: AUDIT_SERVICE_TOKEN, useClass: IamAuditService },
 * })
 * ```
 *
 * ### 只注册权限相关组件
 * ```typescript
 * ApplicationCoreModule.register({
 *   abilityService: { provide: ABILITY_SERVICE_TOKEN, useClass: IamAbilityService },
 *   enableAudit: false,
 * })
 * ```
 *
 * ### 只注册审计相关组件
 * ```typescript
 * ApplicationCoreModule.register({
 *   auditService: { provide: AUDIT_SERVICE_TOKEN, useClass: IamAuditService },
 *   enableAbility: false,
 * })
 * ```
 */
export interface ApplicationCoreModuleOptions {
  /**
   * @description 权限服务提供者（必须 provide 为 `ABILITY_SERVICE_TOKEN`）。
   * @remarks 如果提供了此选项且 `enableAbility` 不为 false，则注册权限相关组件。
   */
  readonly abilityService?: Provider;

  /**
   * @description 审计服务提供者（必须 provide 为 `AUDIT_SERVICE_TOKEN`）。
   * @remarks 如果提供了此选项且 `enableAudit` 不为 false，则注册审计相关组件。
   */
  readonly auditService?: Provider;

  /**
   * @description 是否启用权限相关组件。
   * @remarks 默认值：如果提供了 `abilityService` 则为 true，否则为 false。
   * 如果为 false，则不注册 `CaslAbilityCoordinator`。
   */
  readonly enableAbility?: boolean;

  /**
   * @description 是否启用审计相关组件。
   * @remarks 默认值：如果提供了 `auditService` 则为 true，否则为 false。
   * 如果为 false，则不注册 `AuditCoordinator`、`AuditCommandInterceptor`、`AuditQueryInterceptor`。
   */
  readonly enableAudit?: boolean;

  /**
   * @description 额外需要注册的应用层提供者。
   */
  readonly extraProviders?: Provider[];
}

/**
 * @public
 * @description 应用层核心模块，集中注册命令/查询基线能力。
 *
 * ## 使用场景
 *
 * ### 何时使用 ApplicationCoreModule（聚合模块）
 *
 * 适合以下场景：
 * - ✅ **标准应用**：需要完整的权限校验和审计能力
 * - ✅ **快速接入**：希望在 1 个工作日内完成接入
 * - ✅ **团队规范**：遵循平台统一的应用层基线能力
 *
 * ### 何时独立注册组件
 *
 * 适合以下场景：
 * - ✅ **定制需求**：只需要部分能力（如仅权限校验或仅审计）
 * - ✅ **性能优化**：需要精确控制组件的注册和初始化
 * - ✅ **灵活配置**：需要自定义拦截器的注册顺序或配置
 *
 * ## 组件说明
 *
 * ### 权限相关组件
 * - `CaslAbilityCoordinator`：权限协调器，统一校验命令与查询执行权限
 * - `abilityService`：权限服务，提供权限能力解析
 *
 * ### 审计相关组件
 * - `AuditCoordinator`：审计协调器，统一聚合审计记录
 * - `AuditCommandInterceptor`：命令审计拦截器，自动记录命令执行
 * - `AuditQueryInterceptor`：查询审计拦截器，自动记录查询执行
 * - `auditService`：审计服务，提供审计记录持久化
 *
 * ## 依赖关系
 *
 * - `AuditCommandInterceptor` 和 `AuditQueryInterceptor` 依赖于 `AuditCoordinator`
 * - 如果启用审计，必须提供 `auditService`
 * - 如果启用权限，必须提供 `abilityService`
 *
 * @example
 * ```typescript
 * // 注册所有组件
 * @Module({
 *   imports: [
 *     ApplicationCoreModule.register({
 *       abilityService: { provide: ABILITY_SERVICE_TOKEN, useClass: IamAbilityService },
 *       auditService: { provide: AUDIT_SERVICE_TOKEN, useClass: IamAuditService },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 只注册权限相关组件
 * @Module({
 *   imports: [
 *     ApplicationCoreModule.register({
 *       abilityService: { provide: ABILITY_SERVICE_TOKEN, useClass: IamAbilityService },
 *       enableAudit: false,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 只注册审计相关组件
 * @Module({
 *   imports: [
 *     ApplicationCoreModule.register({
 *       auditService: { provide: AUDIT_SERVICE_TOKEN, useClass: IamAuditService },
 *       enableAbility: false,
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
   * @remarks 根据选项注册权限和审计相关组件。
   *
   * ## 业务规则
   *
   * ### 组件注册规则
   * - 如果 `enableAbility` 为 true（或提供了 `abilityService` 且 `enableAbility` 不为 false），则注册权限相关组件
   * - 如果 `enableAudit` 为 true（或提供了 `auditService` 且 `enableAudit` 不为 false），则注册审计相关组件
   * - 如果提供了 `abilityService`，则自动注册权限相关组件（除非 `enableAbility` 为 false）
   * - 如果提供了 `auditService`，则自动注册审计相关组件（除非 `enableAudit` 为 false）
   *
   * ### 依赖关系规则
   * - `AuditCommandInterceptor` 和 `AuditQueryInterceptor` 依赖于 `AuditCoordinator`
   * - 如果启用审计但未提供 `auditService`，拦截器将无法正常工作
   * - 如果启用权限但未提供 `abilityService`，权限协调器将无法正常工作
   *
   * @param options - 模块配置选项
   * @returns 动态模块
   *
   * @example
   * ```typescript
   * // 注册所有组件
   * ApplicationCoreModule.register({
   *   abilityService: { provide: ABILITY_SERVICE_TOKEN, useClass: IamAbilityService },
   *   auditService: { provide: AUDIT_SERVICE_TOKEN, useClass: IamAuditService },
   * })
   *
   * // 只注册权限相关组件
   * ApplicationCoreModule.register({
   *   abilityService: { provide: ABILITY_SERVICE_TOKEN, useClass: IamAbilityService },
   *   enableAudit: false,
   * })
   *
   * // 只注册审计相关组件
   * ApplicationCoreModule.register({
   *   auditService: { provide: AUDIT_SERVICE_TOKEN, useClass: IamAuditService },
   *   enableAbility: false,
   * })
   * ```
   */
  public static register(
    options: ApplicationCoreModuleOptions = {},
  ): DynamicModule {
    const {
      abilityService,
      auditService,
      enableAbility = !!abilityService,
      enableAudit = !!auditService,
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

    // 审计相关组件
    if (enableAudit) {
      providers.push(AuditCoordinator);
      providers.push(AuditCommandInterceptor);
      providers.push(AuditQueryInterceptor);
      exports.push(
        AuditCoordinator,
        AuditCommandInterceptor,
        AuditQueryInterceptor,
        AUDIT_SERVICE_TOKEN,
      );
      if (auditService) {
        providers.push(auditService);
      }
    }

    // 额外提供者
    if (extraProviders?.length) {
      providers.push(...extraProviders);
    }

    return {
      module: ApplicationCoreModule,
      global: true, // 注册为全局模块，使所有业务模块都可以访问 CaslAbilityCoordinator 和 AuditCoordinator
      imports: [CqrsModule],
      providers,
      exports,
    };
  }
}
