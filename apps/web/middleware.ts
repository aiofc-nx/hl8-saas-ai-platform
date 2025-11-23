// export { auth as middleware } from '@/auth';

import {
  refreshAccessToken,
  validateSessionIfExist,
} from '@/server/auth.server';
import { auth } from './auth';

/**
 * @description Next.js 中间件，用于处理请求前的认证和会话管理
 * @remarks
 * - 在每次请求保护路由前，检查并刷新访问令牌（如需要）
 * - 验证服务器端会话是否有效
 * @param req - 请求对象，包含认证信息和用户数据
 */
export default auth(async (req) => {
  // 刷新访问令牌（如需要）
  if (req.auth && req.auth.user) {
    const user = req.auth.user;
    const session_refresh_time = new Date(
      user.tokens.session_refresh_time,
    ).getTime();
    const now = new Date().getTime();
    if (session_refresh_time <= now) {
      console.log('========== 刷新访问令牌开始 =========');
      await refreshAccessToken(user);
      console.log('========== 刷新访问令牌结束 =========');
    }
  }
  // 验证服务器端会话
  if (req.auth && req.auth.user) {
    console.log(`========== 验证服务器会话开始 =========`);
    try {
      await validateSessionIfExist();
      console.log('========== 验证服务器会话结束 =========');
    } catch (error) {
      // 会话验证失败时，记录错误但不阻止请求
      // 因为可能是未登录用户访问公开页面，或者会话已过期需要重新登录
      console.error('========== 验证服务器会话失败 =========', error);
      // 不抛出错误，让请求继续处理
      // NextAuth 会自动处理未认证的请求
    }
  }
});

/**
 * @description 中间件配置
 * @remarks 配置中间件匹配规则，排除 API 路由、静态资源和图片文件
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
