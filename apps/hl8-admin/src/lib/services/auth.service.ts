import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 用户注册请求参数
 */
export interface RegisterRequest {
  /**
   * 用户邮箱地址
   */
  email: string
  /**
   * 用户密码
   */
  password: string
}

/**
 * 邮箱确认请求参数
 */
export interface ConfirmEmailRequest {
  /**
   * 用户邮箱地址
   */
  email: string
  /**
   * OTP 验证码（6 位数字）
   */
  token: string
}

/**
 * 用户登录请求参数
 */
export interface SignInRequest {
  /**
   * 用户标识符（邮箱或用户名）
   */
  identifier: string
  /**
   * 用户密码
   */
  password: string
}

/**
 * 刷新令牌请求参数
 */
export interface RefreshTokenRequest {
  /**
   * 用户 ID
   */
  user_id: string
  /**
   * 会话令牌
   */
  session_token: string
}

/**
 * 用户登出请求参数
 */
export interface SignOutRequest {
  /**
   * 会话令牌（UUID）
   */
  session_token: string
}

/**
 * 登录响应数据
 */
export interface SignInResponseData {
  /**
   * 用户 ID
   */
  id: string
  /**
   * 用户邮箱
   */
  email: string
  /**
   * 用户名
   */
  username: string
  /**
   * 邮箱是否已验证
   */
  isEmailVerified: boolean
  /**
   * 邮箱验证时间
   */
  emailVerifiedAt?: string
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string
  /**
   * 个人资料（如果存在）
   */
  profile?: unknown
}

/**
 * 登录响应（包含令牌）
 */
export interface SignInResponse {
  /**
   * 响应消息
   */
  message: string
  /**
   * 用户数据
   */
  data: SignInResponseData
  /**
   * 认证令牌
   */
  tokens: {
    /**
     * 访问令牌
     */
    access_token: string
    /**
     * 刷新令牌
     */
    refresh_token: string
    /**
     * 会话令牌
     */
    session_token: string
    /**
     * 访问令牌刷新时间
     */
    session_refresh_time: string
  }
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  /**
   * 响应消息
   */
  message: string
  /**
   * 访问令牌
   */
  access_token: string
  /**
   * 刷新令牌
   */
  refresh_token: string
  /**
   * 访问令牌刷新时间
   */
  access_token_refresh_time: string
  /**
   * 会话令牌
   */
  session_token: string
}

/**
 * 认证服务
 * 提供用户注册、登录、邮箱确认、令牌刷新、登出等认证相关的 API 调用
 */
export const authService = {
  /**
   * 用户注册
   * 创建新用户账户，后端会发送验证码到注册邮箱
   *
   * @param data - 注册数据（邮箱和密码）
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.register({
   *   email: 'user@example.com',
   *   password: 'password123'
   * })
   * ```
   */
  async register(data: RegisterRequest): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/sign-up', data, {
      skipDataExtraction: true,
    })
    return response.data as ApiResponse
  },

  /**
   * 确认邮箱（OTP 验证）
   * 使用 OTP 验证码确认用户邮箱，验证成功后自动登录并返回令牌
   *
   * @param data - 邮箱确认数据（邮箱和验证码）
   * @returns Promise，解析为登录响应（包含用户数据和令牌）
   *
   * @example
   * ```ts
   * const response = await authService.confirmEmail({
   *   email: 'user@example.com',
   *   token: '123456'
   * })
   * ```
   */
  async confirmEmail(data: ConfirmEmailRequest): Promise<SignInResponse> {
    const response = await apiClient.patch<SignInResponse>(
      '/auth/confirm-email',
      data,
      {
        skipDataExtraction: true,
      }
    )
    return response.data as SignInResponse
  },

  /**
   * 用户登录
   * 验证用户凭据，生成访问令牌和刷新令牌
   *
   * @param data - 登录数据（标识符和密码）
   * @returns Promise，解析为登录响应（包含用户数据和令牌）
   *
   * @remarks
   * identifier 可以是邮箱或用户名
   * 设备信息会自动通过请求拦截器添加
   *
   * @example
   * ```ts
   * const response = await authService.signIn({
   *   identifier: 'user@example.com',
   *   password: 'password123'
   * })
   * ```
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    const response = await apiClient.post<SignInResponse>(
      '/auth/sign-in',
      data,
      {
        skipDataExtraction: true,
      }
    )
    return response.data as SignInResponse
  },

  /**
   * 刷新访问令牌
   * 使用刷新令牌生成新的访问令牌和刷新令牌对
   *
   * @param data - 刷新令牌数据（用户 ID 和会话令牌）
   * @returns Promise，解析为刷新令牌响应
   *
   * @example
   * ```ts
   * const response = await authService.refreshToken({
   *   user_id: 'user-id',
   *   session_token: 'session-token'
   * })
   * ```
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.patch<RefreshTokenResponse>(
      '/auth/refresh-token',
      data,
      {
        skipDataExtraction: true,
      }
    )
    return response.data as RefreshTokenResponse
  },

  /**
   * 用户登出
   * 删除当前设备的会话记录
   *
   * @param data - 登出数据（会话令牌）
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.signOut({
   *   session_token: 'session-token'
   * })
   * ```
   */
  async signOut(data: SignOutRequest): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/sign-out', data, {
      skipDataExtraction: true,
    })
    return response.data as ApiResponse
  },

  /**
   * 重发确认邮件
   * 为未验证邮箱的用户重新发送确认邮件
   *
   * @param email - 用户邮箱地址
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.resendConfirmationEmail('user@example.com')
   * ```
   */
  async resendConfirmationEmail(email: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(
      '/auth/resend-confirmation-email',
      { email },
      {
        skipDataExtraction: true,
      }
    )
    return response.data as ApiResponse
  },
}
