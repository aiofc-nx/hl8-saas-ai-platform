'use server';

import { auth, signIn, signOut, update } from '@/auth';
import { safeAction, safeFetch } from '@/lib';
import { getDeviceInfo } from '@/lib/device';
import {
  ChangePasswordSchema,
  ConfirmEmailSchema,
  DeleteAccountSchema,
  ForgotPasswordSchema,
  GetSession,
  GetSessionSchema,
  GetSessionsSchema,
  RefreshToken,
  RefreshTokenSchema,
  ResetPasswordSchema,
  Session,
  SignIn,
  SignInDataSchema,
  SignInSchema,
  SignOutSchema,
  SignUpSchema,
} from '@/types/auth.type';
import { DefaultReturnSchema } from '@/types/default.type';
import { AuthError, User } from 'next-auth';
import { revalidateTag } from 'next/cache';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { redirect } from 'next/navigation';

/**
 * @description 解析并发送基于凭证的登录请求（包含设备信息）到后端
 * @param credentials - 登录凭证对象，包含标识符（邮箱或用户名）和密码
 * @returns 返回用户对象，如果登录失败则返回 null
 * @throws 如果网络请求失败或响应数据格式错误，会在控制台输出错误信息并返回 null
 */
export const authorizeSignIn = async (
  credentials: SignIn,
): Promise<null | User> => {
  const deviceInfo = await getDeviceInfo();
  const [error, data] = await safeFetch(SignInDataSchema, '/auth/sign-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      ...credentials,
      ...deviceInfo,
    }),
  });

  if (error) {
    console.error('authorizeSignIn failed:', error);
    return null;
  }

  if (!data) {
    console.error('authorizeSignIn: data is null or undefined');
    return null;
  }

  const { data: user, tokens } = data;

  if (!user || !tokens) {
    console.error('authorizeSignIn: user or tokens is missing', {
      user,
      tokens,
    });
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isEmailVerified: user.isEmailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: user.profile,
    tokens: tokens,
  };
};

/**
 * @description 使用凭证进行 UI 登录操作的服务器动作
 * @schema SignInSchema
 * @remarks
 * - 先验证用户凭证并获取用户信息
 * - 根据邮箱验证状态进行相应重定向
 * - 未验证邮箱的用户重定向到邮箱确认页面
 * - 已验证邮箱的用户重定向到首页
 * @throws {Error} 当凭证无效时抛出 "Invalid credentials." 错误
 * @throws {AuthError} 当认证过程中出现错误时抛出相应的认证错误
 */
export const signInWithCredentials = safeAction
  .schema(SignInSchema)
  .action(async ({ parsedInput }) => {
    try {
      // 先获取登录后的用户信息，以判断邮箱验证状态
      const user = await authorizeSignIn(parsedInput);

      if (!user) {
        throw new Error('Invalid credentials.');
      }

      // 登录用户（signIn 会抛出重定向错误，这是正常的）
      revalidateTag('/auth/sign-in');
      await signIn('credentials', parsedInput);

      // 如果 signIn 没有抛出重定向错误，根据邮箱验证状态手动重定向
      if (!user.isEmailVerified) {
        // 未验证邮箱，重定向到邮箱确认页面
        redirect('/auth/confirm-email');
      } else {
        // 已验证邮箱，重定向到首页
        redirect('/');
      }
    } catch (error) {
      // Next.js 的重定向错误是正常的，表示登录成功需要重定向
      if (isRedirectError(error)) {
        throw error; // 让 Next.js 处理重定向
      }
      // 处理认证错误
      if (error instanceof AuthError) {
        if (error.type === 'CredentialsSignin') {
          throw new Error('Invalid credentials.');
        }
        throw new Error('Something went wrong.');
      }
      // 其他未知错误
      throw error;
    }
  });

/**
 * @description 用户注册服务器动作，注册成功后自动登录
 * @schema SignUpSchema
 * @remarks
 * - 发送注册请求到后端
 * - 注册成功后自动使用注册的邮箱和密码登录
 * - 重定向到邮箱确认页面
 * @throws {Error} 当注册失败时抛出相应的错误信息
 * @throws {AuthError} 当自动登录失败时抛出相应的认证错误
 */
export const signUpWithCredentials = safeAction
  .schema(SignUpSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [error] = await safeFetch(DefaultReturnSchema, '/auth/sign-up', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(parsedInput),
      });

      if (error) {
        throw new Error(error);
      }

      try {
        await signIn('credentials', {
          identifier: parsedInput.email,
          password: parsedInput.password,
        });
        // 如果 signIn 成功但没有抛出 RedirectError，返回成功标志
        revalidateTag('/auth/sign-up');
        return { success: true, redirectTo: '/auth/confirm-email' };
      } catch (signInError) {
        // Next.js 的重定向错误是正常的，表示登录成功需要重定向
        if (isRedirectError(signInError)) {
          revalidateTag('/auth/sign-up');
          redirect('/auth/confirm-email');
        }
        // 处理认证错误
        if (signInError instanceof AuthError) {
          if (signInError.type === 'CredentialsSignin') {
            throw new Error('Failed to sign in after registration.');
          }
          throw new Error(
            'Something went wrong while executing the operation.',
          );
        }
        // 其他未知错误
        throw signInError;
      }
    } catch (error) {
      // 如果是重定向错误，直接抛出（让 Next.js 处理）
      if (isRedirectError(error)) {
        throw error;
      }
      // 其他错误转换为 Error 对象
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Something went wrong while executing the operation.');
    }
  });

/**
 * @description 通过会话令牌登出指定设备
 * @param token - 会话令牌字符串
 * @throws {string} 当登出请求失败时抛出错误信息
 * @remarks 此函数为内部函数，用于登出操作的核心逻辑
 */
const signOutBySessionToken = async (token: string) => {
  const session = await auth();

  const [error] = await safeFetch(DefaultReturnSchema, '/auth/sign-out', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.user.tokens.access_token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ session_token: token }),
  });

  if (error) throw error;

  revalidateTag('nest-auth-sessions');
};

/**
 * @description 登出当前设备的服务器动作
 * @returns 返回 'success' 字符串表示登出成功
 * @remarks
 * - 获取当前会话并使用会话令牌登出
 * - 登出后重定向到首页
 * @throws {Error} 当登出请求失败时抛出错误
 */
export const signOutCurrentDevice = safeAction.action(async () => {
  const session = await auth();
  if (!session) return;

  await signOutBySessionToken(session.user.tokens.session_token);
  await signOut({ redirect: true, redirectTo: '/' });

  return 'success';
});

/**
 * @description 通过会话令牌登出其他设备的服务器动作
 * @schema SignOutSchema
 * @returns 返回 'success' 字符串表示登出成功
 * @throws {Error} 当登出请求失败时抛出错误
 * @remarks 用于在账户管理页面远程登出其他设备
 */
export const signOutOtherDevice = safeAction
  .schema(SignOutSchema)
  .action(async ({ parsedInput }) => {
    await signOutBySessionToken(parsedInput.session_token);
    return 'success';
  });

/**
 * @description 登出所有设备的服务器动作
 * @remarks
 * - 发送登出所有设备的请求到后端
 * - 登出成功后重定向到首页
 * @throws {Error} 当登出请求失败时抛出错误
 */
export const signOutAllDevice = safeAction.action(async () => {
  const session = await auth();

  const [error] = await safeFetch(
    DefaultReturnSchema,
    '/auth/sign-out-allDevices',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.user?.tokens.access_token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ userId: session?.user.id }),
    },
  );

  if (!error) {
    revalidateTag('nest-auth-sessions');
    await signOut({ redirect: true, redirectTo: '/' });
  }
});

/**
 * @description 修改当前用户密码的服务器动作
 * @schema ChangePasswordSchema
 * @returns 返回修改密码操作的响应数据
 * @throws {Error} 当修改密码请求失败时抛出错误
 * @remarks
 * - 从解析后的输入中移除确认新密码字段（仅用于前端验证）
 * - 使用当前用户的邮箱作为标识符
 */
export const changePassword = safeAction
  .schema(ChangePasswordSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmNewPassword, ...payload } = parsedInput;

    const [error, resultData] = await safeFetch(
      DefaultReturnSchema,
      '/auth/change-password',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.tokens.access_token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          identifier: session?.user.email,
          ...payload,
        }),
      },
    );

    if (error || !resultData) throw new Error(error || 'No data returned');
    return resultData;
  });

/**
 * @description 重新发送邮箱确认邮件的服务器动作
 * @returns 返回发送邮件的响应数据
 * @throws {Error} 当用户邮箱不存在或发送邮件失败时抛出错误
 * @remarks 使用当前会话中的用户邮箱发送确认邮件
 */
export const resendConfirmationEmail = safeAction.action(async () => {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('User email not found');
  }

  const [error, data] = await safeFetch(
    DefaultReturnSchema,
    '/auth/resend-confirmation-email',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({ email: session.user.email }),
    },
  );

  if (error || !data) throw new Error(error || 'No data returned');
  return data;
});

/**
 * @description 发送忘记密码邮件的服务器动作
 * @schema ForgotPasswordSchema
 * @remarks
 * - 发送密码重置邮件到指定邮箱
 * - 成功后重定向到重置密码页面，并携带邮箱和成功消息参数
 * @throws {Error} 当发送邮件失败时抛出错误
 */
export const forgotPassword = safeAction
  .schema(ForgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [error, data] = await safeFetch(
        DefaultReturnSchema,
        '/auth/forgot-password',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify(parsedInput),
        },
      );
      if (error) throw new Error(error);

      // 重定向到重置密码页面
      redirect(
        `/auth/reset-password?email=${encodeURIComponent(parsedInput.identifier)}&message=${encodeURIComponent(data?.message || 'Password reset code has been sent to your email')}`,
      );
    } catch (error) {
      // 如果是重定向错误，直接抛出（让 Next.js 处理）
      if (isRedirectError(error)) {
        throw error;
      }
      // 其他错误转换为 Error 对象
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send password reset email');
    }
  });

/**
 * @description 使用重置令牌重置密码的服务器动作
 * @schema ResetPasswordSchema
 * @remarks
 * - 使用提供的重置令牌和新密码重置用户密码
 * - 成功后重定向到登录页面
 * @throws {Error} 当重置密码请求失败时抛出错误
 */
export const resetPassword = safeAction
  .schema(ResetPasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [error] = await safeFetch(
        DefaultReturnSchema,
        '/auth/reset-password',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify(parsedInput),
        },
      );
      if (error) throw new Error(error);

      // 重定向到登录页面
      redirect('/auth/sign-in');
    } catch (error) {
      // 如果是重定向错误，直接抛出（让 Next.js 处理）
      if (isRedirectError(error)) {
        throw error;
      }
      // 其他错误转换为 Error 对象
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reset password');
    }
  });

/**
 * @description 通过当前会话的会话令牌获取会话详情
 * @schema GetSessionSchema
 * @returns 返回会话数据或错误信息的元组
 * @remarks
 * - 使用当前会话的会话令牌查询会话详情
 * - 响应缓存 24 小时，使用标签 'next-auth-session' 进行重新验证
 */
export const getSessionById = async () => {
  const session = await auth();
  return await safeFetch(
    GetSessionSchema,
    `/auth/session/${session?.user?.tokens.session_token}`,
    {
      next: {
        tags: ['next-auth-session'],
        revalidate: 86400, // 24 hours
      },
      headers: {
        Authorization: `Bearer ${session?.user?.tokens.access_token}`,
      },
    },
  );
};

/**
 * @description 获取当前用户的所有活跃会话
 * @returns 返回会话数组，如果请求失败则返回空数组
 * @remarks
 * - 使用当前用户的 ID 查询所有活跃会话
 * - 响应缓存 1 小时，使用标签 'nest-auth-sessions' 进行重新验证
 */
export const getAuthSessions = async (): Promise<Session[]> => {
  const session = await auth();

  const [error, data] = await safeFetch(
    GetSessionsSchema,
    `/auth/sessions/${session?.user.id}`,
    {
      next: {
        tags: ['nest-auth-sessions'],
        revalidate: 3600, // 1 hour
      },
      headers: {
        Authorization: `Bearer ${session?.user?.tokens.access_token}`,
      },
    },
  );

  if (error || !data) return [];
  return data.data;
};

/**
 * @description 使用令牌确认邮箱的服务器动作
 * @schema ConfirmEmailSchema
 * @remarks
 * - 发送确认邮箱请求到后端
 * - 成功后更新会话中的邮箱验证状态
 * - 重定向到首页
 * @throws {Error} 当确认邮箱请求失败时抛出错误
 */
export const confirmEmail = safeAction
  .schema(ConfirmEmailSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    const [error] = await safeFetch(
      DefaultReturnSchema,
      '/auth/confirm-email',
      {
        method: 'PATCH',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${session?.user?.tokens.access_token}`,
        },
        body: JSON.stringify(parsedInput),
      },
    );
    if (error) throw new Error(error);
    await update({
      user: {
        isEmailVerified: true,
      },
    });
    redirect(`/`);
  });

/**
 * @description 更新认证会话中的令牌信息
 * @param data - 刷新令牌响应数据，包含新的访问令牌、刷新令牌、会话令牌和刷新时间
 * @remarks 此函数为内部函数，用于更新 NextAuth 会话中的令牌数据
 */
const updateTokens = async (data: RefreshToken) => {
  await update({
    user: {
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        session_token: data.session_token,
        session_refresh_time: data.access_token_refresh_time,
      },
    },
  });
};

/**
 * @description 使用刷新令牌刷新访问令牌
 * @param user - 当前用户对象，包含令牌信息
 * @returns 返回刷新结果，如果失败则返回 undefined
 * @remarks
 * - 当访问令牌过期时，使用刷新令牌获取新的访问令牌
 * - 成功后更新会话中的令牌信息
 * - 如果刷新失败，会在控制台输出错误信息
 */
export const refreshAccessToken = async (user: User): Promise<unknown> => {
  const [error, data] = await safeFetch(
    RefreshTokenSchema,
    '/auth/refresh-token',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.tokens.refresh_token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        session_token: user.tokens.session_token,
        user_id: user.id,
      }),
    },
  );
  if (error) {
    console.log('Refresh access token error', error);
    return;
  }
  if (!data) {
    console.log('Refresh access token: data is null');
    return;
  }
  await updateTokens(data);
};

/**
 * @description 验证服务器端会话是否存在且有效
 * @returns 返回会话数据
 * @remarks
 * - 如果验证失败（会话不存在或已过期），会自动登出用户
 * - 验证成功会在控制台输出成功信息
 * @throws 当会话验证失败时，会自动执行登出操作
 */
export const validateSessionIfExist = async (): Promise<GetSession> => {
  const [error, data] = await getSessionById();
  if (error || !data) {
    console.log('Validate session error', error || 'No data returned');
    await signOut({
      redirect: false,
    });
    throw new Error(error || 'Session validation failed: no data returned');
  }
  console.log('Validate session success');
  return data;
};

/**
 * @description 删除用户账户的服务器动作
 * @schema DeleteAccountSchema
 * @remarks
 * - 需要提供用户密码以确认删除操作
 * - 删除成功后重定向到登录页面
 * @throws {Error} 当删除账户请求失败时抛出错误
 */
export const deleteAccount = safeAction
  .schema(DeleteAccountSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    const [error] = await safeFetch(
      DefaultReturnSchema,
      '/auth/delete-account',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.tokens.access_token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          user_id: session?.user.id,
          password: parsedInput.password,
        }),
      },
    );
    if (error) throw new Error(error);
    redirect('/auth/sign-in');
  });
