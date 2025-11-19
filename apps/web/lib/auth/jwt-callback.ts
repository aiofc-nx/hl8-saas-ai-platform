import { triggerType } from '@/lib/auth';
import { Session, User } from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';

/**
 * @description 处理 NextAuth 中的 JWT 回调，用于自定义令牌负载
 * @param token - 当前 JWT 令牌
 * @param user - 登录时返回的用户对象或适配器用户对象
 * @param trigger - 触发事件，例如 'signIn' 或 'update'
 * @param session - 当前会话数据
 * @returns 更新后的 JWT 令牌
 * @remarks
 * - 当触发类型为 "update" 时，将会话用户数据合并到现有令牌中
 * - 当触发类型为 "signIn" 时，使用详细的用户信息初始化令牌
 */
export const jwtCallback = ({
  token,
  user,
  trigger,
  session,
}: {
  token: JWT;
  user?: User | AdapterUser;
  trigger: triggerType;
  session: Session;
}): JWT => {
  if (trigger === 'update') {
    // 确保 token.user 存在后再展开
    return {
      ...token,
      user: {
        ...(token.user || {}),
        ...session.user,
      },
    };
  }

  if (trigger === 'signIn') {
    if (user) {
      return {
        ...token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isEmailVerified: user.isEmailVerified,
          emailVerifiedAt: user.emailVerifiedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile: user.profile,
          tokens: user.tokens,
        },
      };
    }
  }

  return token;
};
