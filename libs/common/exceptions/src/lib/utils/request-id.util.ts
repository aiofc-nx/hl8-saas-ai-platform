import type { ArgumentsHost } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * @description 从请求上下文中提取请求 ID，若不存在则生成随机值
 *
 * 提取优先级：
 * 1. `request.requestId` - 自定义请求 ID（通常由中间件设置）
 * 2. `request.id` - 框架生成的请求 ID
 * 3. `request.headers['x-request-id']` - 标准请求头
 * 4. 生成随机 UUID
 *
 * @param httpContext - Nest HTTP 上下文
 * @returns 可用于 `ErrorResponse.instance` 的请求标识
 * @example
 * ```typescript
 * const context = host.switchToHttp();
 * const requestId = resolveRequestId(context);
 * // => 'req-123' 或 '550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function resolveRequestId(
  httpContext: ReturnType<ArgumentsHost['switchToHttp']>,
): string {
  const request = httpContext.getRequest();
  if (!request) {
    return randomUUID();
  }

  // 优先级 1: request.requestId
  const candidate =
    request.requestId ?? request.id ?? request.headers?.['x-request-id'];

  if (candidate === null || candidate === undefined) {
    return randomUUID();
  }

  // 字符串类型直接返回
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  // 数字类型转换为字符串
  if (typeof candidate === 'number' && !Number.isNaN(candidate)) {
    return candidate.toString();
  }

  // 尝试调用 toString 方法
  if (
    typeof candidate === 'object' &&
    typeof candidate.toString === 'function'
  ) {
    try {
      const stringValue = candidate.toString();
      if (typeof stringValue === 'string' && stringValue.trim().length > 0) {
        return stringValue.trim();
      }
    } catch {
      // toString 可能抛出异常，忽略并继续
    }
  }

  // 所有尝试都失败，生成新的 UUID
  return randomUUID();
}
