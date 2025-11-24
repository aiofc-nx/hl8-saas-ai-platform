/**
 * @fileoverview ExecutionContext 参数装饰器
 * @description 用于在控制器方法中注入 ExecutionContext
 *
 * ## 业务规则
 *
 * ### 使用规则
 * - 装饰器从请求对象中提取 ExecutionContext
 * - 支持从 `request.executionContext` 或 `request.user?.executionContext` 或 `request.securityContext` 或 `request.user?.securityContext` 获取（向后兼容）
 * - 如果 ExecutionContext 不存在，抛出异常
 *
 * ## 使用示例
 *
 * ```typescript
 * @Controller("tenants")
 * export class TenantController {
 *   @Post()
 *   async createTenant(
 *     @Body() dto: CreateTenantDto,
 *     @ExecutionContextParam() executionContext: ExecutionContext,
 *   ): Promise<void> {
 *     // 使用 executionContext
 *   }
 * }
 * ```
 */

import type { ExecutionContext as AuthExecutionContext } from '@hl8/common';
import { GeneralBadRequestException } from '@hl8/exceptions';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * ExecutionContext 参数装饰器
 *
 * @description 从请求对象中提取 ExecutionContext 并注入到控制器方法参数中
 *
 * @returns 参数装饰器函数
 *
 * @throws {GeneralBadRequestException} 当 ExecutionContext 不存在时抛出
 *
 * @example
 * ```typescript
 * import { ExecutionContextParam } from '@hl8/auth';
 * import type { ExecutionContext } from '@hl8/auth';
 *
 * @Post()
 * async createTenant(
 *   @Body() dto: CreateTenantDto,
 *   @ExecutionContextParam() executionContext: ExecutionContext,
 * ): Promise<void> {
 *   // 使用 executionContext
 * }
 * ```
 */
export const ExecutionContextParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthExecutionContext => {
    const request = ctx.switchToHttp().getRequest<{
      executionContext?: AuthExecutionContext;
      securityContext?: AuthExecutionContext; // 向后兼容
      user?: {
        executionContext?: AuthExecutionContext;
        securityContext?: AuthExecutionContext; // 向后兼容
      };
    }>();

    // 优先从 request.executionContext 获取
    // 其次从 request.securityContext 获取（向后兼容）
    // 再次从 request.user?.executionContext 获取
    // 最后从 request.user?.securityContext 获取（向后兼容）
    const executionContext =
      request?.executionContext ??
      request?.securityContext ??
      request?.user?.executionContext ??
      request?.user?.securityContext;

    if (!executionContext) {
      throw new GeneralBadRequestException({
        field: 'executionContext',
        message: '执行上下文缺失，禁止执行操作',
      });
    }

    // 验证必填字段
    if (!executionContext.tenantId) {
      throw new GeneralBadRequestException({
        field: 'executionContext.tenantId',
        message: '执行上下文缺少租户标识',
      });
    }

    if (!executionContext.userId) {
      throw new GeneralBadRequestException({
        field: 'executionContext.userId',
        message: '执行上下文缺少用户标识',
      });
    }

    return executionContext;
  },
);
