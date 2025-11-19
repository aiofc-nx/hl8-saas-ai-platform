import { UserSchema } from '@/types/user.type';
import { z } from 'zod';

/**
 * Schema for validating password strength.
 */
const passWordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((val) => /\d/.test(val), {
    message: 'Password must contain at least one number',
  })
  .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
    message: 'Password must contain at least one special character',
  });

/**
 * Schema for user sign-up.
 */
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: passWordSchema,
});

/**
 * Schema for user sign-in using either email or username.
 */
export const SignInSchema = z.object({
  identifier: z.string().min(1, {
    message: 'Email or Username is required!',
  }),
  password: z.string().min(1, {
    message: 'Password is required!',
  }),
});

export type SignIn = z.infer<typeof SignInSchema>;

/**
 * Schema for sign-in response data, including user info and tokens.
 */
export const SignInDataSchema = z.object({
  message: z.string().optional(), // 后端返回的消息字段（可选）
  data: UserSchema,
  tokens: z.object({
    refresh_token: z.string(),
    access_token: z.string(),
    session_token: z.string(),
    session_refresh_time: z.string().transform((val) => {
      // 将 ISO 字符串转换为 Date 对象
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${val}`);
      }
      return date;
    }),
  }),
});

/**
 * Schema representing a single session.
 */
export const SessionSchema = z
  .object({
    id: z.string().min(1),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    ip: z.string().min(1),
    browser: z.string().min(1),
    device_os: z.string().min(1),
    device_type: z.string().min(1),
    device_name: z.string().min(1),
    location: z.string().min(1),
    refresh_token: z.string(),
    user_id: z.string().optional(), // 后端可能返回 user 字段而不是 user_id
    user: z.union([z.string(), z.object({ id: z.string() })]).optional(), // 后端可能返回 user 字段（字符串或对象）
  })
  .transform((data) => {
    // 将 user 字段转换为 user_id
    if (data.user) {
      const userId = typeof data.user === 'string' ? data.user : data.user.id;
      return { ...data, user_id: userId, user: undefined };
    }
    return data;
  });

export type Session = z.infer<typeof SessionSchema>;

/**
 * Schema for getting a single session response.
 */
export const GetSessionSchema = z.object({
  data: SessionSchema,
});

export type GetSession = z.infer<typeof GetSessionSchema>;

/**
 * Schema for getting multiple sessions.
 */
export const GetSessionsSchema = z.object({
  data: z.array(SessionSchema),
});

/**
 * Schema for signing out a session using the session token.
 */
export const SignOutSchema = z.object({
  session_token: z.string(),
});

/**
 * Schema for changing password.
 */
export const ChangePasswordSchema = z
  .object({
    password: passWordSchema,
    newPassword: passWordSchema,
    confirmNewPassword: passWordSchema,
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.password !== data.newPassword, {
    message: "Don't use same password!",
    path: ['newPassword'],
  });

/**
 * Schema for initiating password reset (forgot password).
 */
export const ForgotPasswordSchema = z.object({
  identifier: z.string(),
});

/**
 * Schema for resetting password using a token.
 */
export const ResetPasswordSchema = z.object({
  identifier: z.string(),
  resetToken: z.string().min(6).max(6),
  newPassword: z.string(),
});

/**
 * Schema for confirming email using a token.
 */
export const ConfirmEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6).max(6),
});

/**
 * Schema for refreshing access token with refresh token.
 */
export const RefreshTokenSchema = z.object({
  refresh_token: z.string(),
  access_token: z.string(),
  session_token: z.string(),
  access_token_refresh_time: z.coerce.date(),
});

export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

/**
 * Schema for deleting a user account.
 */
export const DeleteAccountSchema = z.object({
  password: z.string().min(1),
});

/**
 * Schema for delete account response data.
 */
export const DeleteAccountData = z.object({});
