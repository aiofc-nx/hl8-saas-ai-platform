import { GeneralForbiddenException } from '@hl8/exceptions';
import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../execution-context/execution-context';
import type { QueryBase } from './query.base.js';

/**
 * @public
 * @description 查询处理器基类，提供查询执行的框架。
 * @remarks 权限校验和审计记录应由基础设施层通过拦截器或装饰器处理。
 */
@Injectable()
export abstract class QueryHandler<
  TQuery extends QueryBase<TResult>,
  TResult = unknown,
> {
  /**
   * @description 执行查询。
   * @param query - 待执行的查询。
   * @returns 查询结果。
   */
  public async execute(query: TQuery): Promise<TResult> {
    return this.handle(query);
  }

  /**
   * @description 由具体查询处理器实现的业务逻辑。
   */
  protected abstract handle(query: TQuery): Promise<TResult>;

  /**
   * @description 校验查询是否在同租户范围内执行。
   * @param context - 执行上下文。
   * @param tenantId - 目标租户标识。
   * @param message - 自定义错误文案。
   * @throws {GeneralForbiddenException} 当上下文与目标租户不一致时抛出。
   */
  protected assertTenantScope(
    context: ExecutionContext,
    tenantId: string,
    message = '禁止跨租户访问资源',
  ): void {
    if (!context.tenantId) {
      throw new GeneralForbiddenException('执行上下文缺少租户标识');
    }
    if (context.tenantId !== tenantId) {
      throw new GeneralForbiddenException(message);
    }
  }

  /**
   * @description 校验查询是否在同组织范围内执行。
   * @param context - 执行上下文。
   * @param organizationId - 目标组织标识。
   * @param message - 自定义错误文案。
   * @throws {GeneralForbiddenException} 当上下文未声明组织或不包含指定组织时抛出。
   */
  protected assertOrganizationScope(
    context: ExecutionContext,
    organizationId: string,
    message = '禁止跨组织访问资源',
  ): void {
    const { organizationIds } = context;
    if (!organizationIds || !organizationIds.includes(organizationId)) {
      throw new GeneralForbiddenException(message);
    }
  }

  /**
   * @description 校验查询是否在同部门范围内执行。
   * @param context - 执行上下文。
   * @param departmentId - 目标部门标识。
   * @param message - 自定义错误文案。
   * @throws {GeneralForbiddenException} 当上下文未声明部门或不包含指定部门时抛出。
   */
  protected assertDepartmentScope(
    context: ExecutionContext,
    departmentId: string,
    message = '禁止跨部门访问资源',
  ): void {
    const { departmentIds } = context;
    if (!departmentIds || !departmentIds.includes(departmentId)) {
      throw new GeneralForbiddenException(message);
    }
  }
}
