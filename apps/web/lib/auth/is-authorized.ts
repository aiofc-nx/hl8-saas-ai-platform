import { Session } from 'next-auth';
import { NextRequest } from 'next/server';

/**
 * @description 判断用户是否有权访问特定路由
 * @param request - 包含目标路由的传入请求对象
 * @param auth - 当前会话对象，如果未认证则为 null
 * @returns 如果需要重定向则返回 Response 重定向对象，如果允许访问则返回 true
 * @remarks
 * - 允许无限制访问静态资源，如 `/assets` 和 `/favicon.ico`
 * - 将尝试访问受保护路由的未认证用户重定向到 `/auth/sign-in`
 * - 将未验证邮箱的已认证用户重定向到 `/auth/confirm-email`
 * - 将已验证邮箱的用户从认证页面（如 `/auth/sign-in`）重定向到首页
 */
export const isAuthorized = ({
  request,
  auth,
}: {
  request: NextRequest;
  auth: Session | null;
}) => {
  const isAuth = !!auth?.user;
  const isVerifiedUser = !!auth?.user?.isEmailVerified;
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  // Allow access to public assets
  if (pathname.startsWith('/assets') || pathname.startsWith('/favicon.ico')) {
    return true;
  }

  // Handle unauthenticated access
  if (!isAuth) {
    if (
      pathname === '/' ||
      pathname.startsWith('/p') ||
      pathname.startsWith('/auth/confirm-email')
    ) {
      return Response.redirect(new URL('/auth/sign-in', nextUrl));
    }
  }

  // Handle authenticated user
  if (isAuth) {
    if (!isVerifiedUser) {
      const isAlreadyOnConfirmPage = pathname.startsWith('/auth/confirm-email');
      if (!isAlreadyOnConfirmPage) {
        return Response.redirect(new URL('/auth/confirm-email', nextUrl));
      }
    }

    if (
      pathname.startsWith('/auth/sign') ||
      (pathname.startsWith('/auth/confirm-email') && isVerifiedUser)
    ) {
      return Response.redirect(new URL('/', nextUrl));
    }
  }

  return true;
};
