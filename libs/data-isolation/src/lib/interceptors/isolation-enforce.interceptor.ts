import type { ExecutionContext as AppExecutionContext } from '@hl8/application-base';
import {
  GeneralForbiddenException,
  GeneralUnauthorizedException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  SetMetadata,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import type { Observable } from 'rxjs';
import type { IsolationClsStore } from '../isolation-cls-store.js';
import { IsolationContextExecutor } from '../isolation-context.executor.js';

type LoggerService = InstanceType<typeof Logger>;

/**
 * @description Metadata Key：用于标记当前处理器可跳过隔离校验
 */
export const SKIP_ISOLATION_KEY = 'skipIsolation';

/**
 * @description Metadata Key：用于标记当前处理器可跳过租户校验（向后兼容）
 * @deprecated 请使用 SKIP_ISOLATION_KEY
 */
export const SKIP_TENANT_KEY = SKIP_ISOLATION_KEY;

/**
 * @description 装饰器：在控制器或处理器上声明可跳过隔离过滤
 */
export const SkipIsolation = () => SetMetadata(SKIP_ISOLATION_KEY, true);

/**
 * @description 装饰器：在控制器或处理器上声明可跳过租户过滤（向后兼容）
 * @deprecated 请使用 SkipIsolation
 */
export const SkipTenant = SkipIsolation;

/**
 * @description 数据隔离拦截器，负责在进入业务逻辑前校验并注入隔离上下文
 */
@Injectable()
export class IsolationEnforceInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService<IsolationClsStore>,
    private readonly isolationContextExecutor: IsolationContextExecutor,
    private readonly logger: LoggerService,
  ) {}

  /**
   * @description 拦截 HTTP 请求，确保隔离上下文存在并写入 CLS
   * @param context NestJS 执行上下文
   * @param next 调用链处理器
   * @returns 继续执行的可观察对象
   */
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const handler = context.getHandler();
    const targetClass = context.getClass();
    const skipIsolation = this.reflector.getAllAndOverride<boolean>(
      SKIP_ISOLATION_KEY,
      [handler, targetClass],
    );

    if (skipIsolation) {
      this.logger.warn('当前请求被标记为跳过隔离拦截', {
        controller: targetClass.name,
        handler: handler.name,
      });
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    if (!request) {
      this.logger.error('非 HTTP 请求上下文无法解析隔离信息');
      throw new InternalServerErrorException('无法解析隔离上下文');
    }

    // 优先从 request.executionContext 获取完整的执行上下文
    const executionContext: AppExecutionContext | undefined =
      request.executionContext ??
      request.securityContext ??
      request.user?.executionContext ??
      request.user?.securityContext;

    if (executionContext) {
      // 使用完整的 ExecutionContext
      this.setExecutionContext(executionContext, targetClass, handler);
      return next.handle();
    }

    // 向后兼容：从旧方式获取 tenantId
    const headerTenant = request.headers?.['x-tenant-id'];
    const headerTenantId = Array.isArray(headerTenant)
      ? headerTenant[0]
      : headerTenant;
    const tenantId =
      request.tenantId ?? headerTenantId ?? request.user?.tenantId;

    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      this.logger.error('缺少隔离上下文，拒绝继续处理请求');
      throw new GeneralUnauthorizedException('缺少隔离上下文');
    }

    const clsTenantId = this.cls.get('tenantId');
    if (clsTenantId && clsTenantId !== tenantId) {
      this.logger.error('检测到跨隔离边界访问尝试', undefined, {
        expectedTenantId: clsTenantId,
        incomingTenantId: tenantId,
      });
      throw new GeneralForbiddenException('禁止跨隔离边界访问');
    }

    // 向后兼容：设置旧字段
    this.cls.set('tenantId', tenantId);
    if (request.user?.id) {
      this.cls.set('userId', request.user.id);
    }

    const handlerName =
      (handler &&
        typeof handler === 'function' &&
        (handler as { name?: string }).name) ||
      'UnknownHandler';
    this.logger.log('已注入隔离上下文', {
      tenantId,
      controller: targetClass.name,
      handler: handlerName,
    });

    this.isolationContextExecutor.getTenantIdOrFail();

    return next.handle();
  }

  private setExecutionContext(
    executionContext: AppExecutionContext,
    targetClass: new () => unknown,
    handler?: unknown,
  ): void {
    this.cls.set('executionContext', executionContext);
    // 向后兼容：同时设置旧字段
    this.cls.set('tenantId', executionContext.tenantId);
    if (executionContext.userId) {
      this.cls.set('userId', executionContext.userId);
    }

    const handlerName =
      (handler &&
        typeof handler === 'function' &&
        (handler as { name?: string }).name) ||
      'UnknownHandler';
    this.logger.log('已注入执行上下文', {
      tenantId: executionContext.tenantId,
      userId: executionContext.userId,
      organizationIds: executionContext.organizationIds,
      departmentIds: executionContext.departmentIds,
      controller: targetClass.name,
      handler: handlerName,
    });
  }
}

/**
 * @deprecated 请使用 IsolationEnforceInterceptor
 */
export const TenantEnforceInterceptor = IsolationEnforceInterceptor;
