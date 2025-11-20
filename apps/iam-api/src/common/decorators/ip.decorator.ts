import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 自定义参数装饰器，用于从请求中提取客户端的 IP 地址。
 *
 * @description 此装饰器优先从 'x-forwarded-for' 头中获取 IP 地址（适用于代理/负载均衡场景），
 * 如果不存在则回退到连接对象的远程地址。
 *
 * @param data - 未使用，但装饰器签名需要。
 * @param ctx - 包含 HTTP 请求的执行上下文。
 * @returns 客户端的 IP 地址字符串。
 *
 * @example
 * ```typescript
 * // 在控制器方法中使用
 * @Post('log')
 * logAction(@Ip() ip: string) {
 *   console.log('Client IP:', ip);
 * }
 * ```
 */
export const Ip = createParamDecorator((_, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.headers['x-forwarded-for'] || request.connection.remoteAddress;
});
