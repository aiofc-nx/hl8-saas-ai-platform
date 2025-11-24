import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuditCommandInterceptor } from './audit/audit-command.interceptor.js';
import { AuditCoordinator } from './audit/audit-coordinator.js';
import { AuditQueryInterceptor } from './audit/audit-query.interceptor.js';
import { AUDIT_SERVICE_TOKEN } from './constants/tokens.js';

/**
 * @public
 * @description `AuditApplicationModule` 注册选项。
 */
export interface AuditApplicationModuleOptions {
  /**
   * @description 审计服务提供者（必须 provide 为 `AUDIT_SERVICE_TOKEN`）。
   * @remarks 如果提供了此选项且 `enableAudit` 不为 false，则注册审计相关组件。
   */
  readonly auditService?: Provider;

  /**
   * @description 是否启用审计相关组件。
   * @remarks 默认值：如果提供了 `auditService` 则为 true，否则为 false。
   * 如果为 false，则不注册 `AuditCoordinator`、`AuditCommandInterceptor`、`AuditQueryInterceptor`。
   */
  readonly enableAudit?: boolean;

  /**
   * @description 额外需要注册的提供者。
   */
  readonly extraProviders?: Provider[];
}

/**
 * @public
 * @description 审计应用层模块，集中注册审计相关组件。
 *
 * ## 使用场景
 *
 * ### 何时使用 AuditApplicationModule
 *
 * 适合以下场景：
 * - ✅ **标准应用**：需要完整的审计能力
 * - ✅ **快速接入**：希望在 1 个工作日内完成接入
 * - ✅ **团队规范**：遵循平台统一的审计能力
 *
 * ## 组件说明
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
 *
 * @example
 * ```typescript
 * // 注册所有组件
 * @Module({
 *   imports: [
 *     AuditApplicationModule.register({
 *       auditService: { provide: AUDIT_SERVICE_TOKEN, useClass: IamAuditService },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class AuditApplicationModule {
  /**
   * @description 注册审计应用层能力。
   * @param options - 模块配置选项
   * @returns 动态模块
   */
  public static register(
    options: AuditApplicationModuleOptions = {},
  ): DynamicModule {
    const {
      auditService,
      enableAudit = !!auditService,
      extraProviders,
    } = options;

    const providers: Provider[] = [];
    const exports: Array<string | symbol | Type<unknown>> = [];

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
      module: AuditApplicationModule,
      global: true,
      imports: [CqrsModule],
      providers,
      exports,
    };
  }
}
