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
 * Parses and sends credential-based login with device info to backend.
 * @param credentials
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
 * UI Sign-in action using credentials.
 * @schema SignInSchema
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
 * UI Sign-up action with auto login.
 * @schema SignUpSchema
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
 * Sign out a device by session token.
 * @param token
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
 * Sign out from current device.
 */
export const signOutCurrentDevice = safeAction.action(async () => {
  const session = await auth();
  if (!session) return;

  await signOutBySessionToken(session.user.tokens.session_token);
  await signOut({ redirect: true, redirectTo: '/' });

  return 'success';
});

/**
 * Sign out from a different device by session token.
 * @schema SignOutSchema
 */
export const signOutOtherDevice = safeAction
  .schema(SignOutSchema)
  .action(async ({ parsedInput }) => {
    await signOutBySessionToken(parsedInput.session_token);
    return 'success';
  });

/**
 * Sign out from all devices.
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
 * Change password for the current user.
 * @schema ChangePasswordSchema
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

    if (error) throw new Error(error);
    return resultData;
  });

/**
 * Resend confirmation email.
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

  if (error) throw new Error(error);
  return data;
});

/**
 * Send forgot password email.
 * @schema ForgotPasswordSchema
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
 * Reset password using token.
 * @schema ResetPasswordSchema
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
 * Get current session by token.
 * @schema GetSessionSchema
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
 * Get all active sessions for the user.
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

  if (error) return [];
  return data.data;
};

/**
 * Confirm email with token
 * @schema ConfirmEmailSchema
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
 * Update tokens in auth session
 * @param data
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
 * Refresh access token with refresh token
 * @param user
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
  await updateTokens(data);
};

/**
 * Validate session if exist from server session
 */
export const validateSessionIfExist = async (): Promise<GetSession> => {
  const [error, data] = await getSessionById();
  if (error) {
    console.log('Validate session error', error);
    await signOut({
      redirect: false,
    });
  }
  console.log('Validate session success');
  return data;
};

/**
 * Delete account
 * @schema DeleteAccountSchema
 * @param parsedInput
 * @returns Promise<MessageResponse>
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
