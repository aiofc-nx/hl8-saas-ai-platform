import { Session } from 'next-auth';
import { AdapterSession, AdapterUser } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';

/**
 * @description 将 JWT 令牌数据映射到 NextAuth 会话对象
 * @param session - 当前会话对象
 * @param token - 包含用户信息的 JWT 令牌
 * @returns 包含令牌中详细用户数据的更新后的会话对象
 * @remarks 如果令牌中包含用户信息，则将其合并到会话对象中
 */
export const sessionCallback = ({
  session,
  token,
}: {
  session: {
    user: AdapterUser;
  } & AdapterSession &
    Session;
  token: JWT;
}): Session => {
  // 检查 token 中是否存在 user 对象
  if (token && token.user) {
    const { user } = token;
    return {
      ...session,
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
  return session;
};
