import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 自定义参数装饰器，用于从请求中提取用户对象。
 *
 * @description 从请求对象中提取已认证的用户信息，该用户对象由 JwtAuthGuard 或 JwtRefreshGuard 附加到请求上。
 *
 * @param {unknown} data - 传递给装饰器的可选数据（未使用）。
 * @param {ExecutionContext} ctx - 包含 HTTP 请求的执行上下文。
 * @returns {unknown} 附加到请求的用户对象。
 *
 * @example
 * ```typescript
 * // 在控制器方法中使用
 * @Get('profile')
 * getProfile(@User() user: { id: string; username: string; email: string }) {
 *   return user;
 * }
 * ```
 */
export const User = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
