import { createSafeActionClient } from 'next-safe-action';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

/**
 * @description 创建用于服务器动作的安全动作客户端，提供集中式错误处理
 * @constant
 * @remarks
 * - 包装服务器动作以提供安全的错误处理机制
 * - 当服务器动作中发生错误时，会被捕获并记录到控制台
 * - 错误信息将作为动作结果返回，允许客户端优雅地处理错误
 * - RedirectError 会被重新抛出，以允许 Next.js 正确处理重定向
 */
export const safeAction = createSafeActionClient({
  handleServerError(e) {
    // 如果是重定向错误，重新抛出以让 Next.js 处理
    if (isRedirectError(e)) {
      throw e;
    }
    console.error('Action error:', e.message);
    return e.message;
  },
});
