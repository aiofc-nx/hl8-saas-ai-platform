import { createSafeActionClient } from 'next-safe-action';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

/**
 * Creates a safe action client for server actions with centralized error handling.
 *
 * @constant
 *
 * This client wraps server actions to provide safe error handling.
 * When an error occurs in any server action, it will be caught and logged to the console.
 * The error message will be returned as the result of the action to allow graceful handling on the client side.
 * RedirectError is re-thrown to allow Next.js to handle redirects properly.
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
