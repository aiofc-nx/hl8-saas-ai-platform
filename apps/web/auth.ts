import { env, isAuthorized, jwtCallback, sessionCallback } from '@/lib';
import { authorizeSignIn } from '@/server/auth.server';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const {
  handlers,
  signIn,
  signOut,
  auth,
  unstable_update: update,
} = NextAuth({
  /**
   * @description NextAuth 信任主机配置
   * @remarks 在开发环境中必需，以允许 localhost 访问
   */
  trustHost: true,

  /**
   * @description 身份认证提供者配置
   */
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Identifier', type: 'string' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * @description 凭证提供者的授权逻辑
       * @param credentials - 凭证对象（包含 identifier 和 password）
       * @returns 返回用户对象或 null
       */
      async authorize(credentials) {
        return await authorizeSignIn({
          identifier: credentials.identifier as string,
          password: credentials.password as string,
        });
      },
    }),
  ],

  /**
   * @description 令牌和会话管理的回调函数配置
   */
  callbacks: {
    /**
     * @description 自定义 JWT 回调函数，用于扩展令牌字段
     * @param token - 当前 JWT 令牌
     * @param user - 用户对象（仅在登录时可用）
     * @param trigger - 触发类型（例如："signIn"、"update"）
     * @param session - 当前会话对象（在 update 时）
     * @returns 更新后的 JWT 令牌
     */
    async jwt({ token, user, trigger, session }) {
      return jwtCallback({ token, user, trigger, session });
    },

    /**
     * @description 自定义会话回调函数，用于在会话中包含令牌数据
     * @param session - 当前会话对象
     * @param token - 当前 JWT 令牌
     * @returns 更新后的会话对象
     */
    async session({ session, token }) {
      return sessionCallback({ session, token });
    },

    /**
     * @description 中间件的授权逻辑
     * @param request - 请求对象
     * @param auth - 认证对象（包含令牌/会话信息）
     * @returns 返回 true 表示允许访问，返回 Response.redirect 表示需要重定向
     */
    async authorized({ request, auth }) {
      return isAuthorized({ request, auth });
    },
  },

  /**
   * @description JWT 会话策略配置
   * @remarks
   * - maxAge: 会话总生命周期（秒）
   * - updateAge: 会话重新验证间隔（秒），每 5 天重新验证一次
   */
  session: {
    strategy: 'jwt',
    maxAge: env.AUTH_SESSION_AGE, // 会话总生命周期（秒）
    updateAge: 86400 * 5, // 每 5 天重新验证会话
  },

  /**
   * @description 用于签名 JWT 和加密会话数据的密钥
   */
  secret: env.AUTH_SECRET,

  /**
   * @description 仅在生产环境使用安全 Cookie
   */
  useSecureCookies: env.NODE_ENV === 'production',

  /**
   * @description 在代理后运行时必需（例如：Vercel 或 Cloudflare）
   */
  redirectProxyUrl: env.AUTH_URL,

  /**
   * @description 身份认证流程的自定义页面配置
   */
  pages: {
    signIn: '/auth/sign-in',
    signOut: '/auth/sign-out',
    error: '/auth/sign-in',
    verifyRequest: '/auth/confirm-email',
    newUser: '/auth/sign-up',
  },
});
