import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import type { SignInResponseData } from '@/lib/services/auth.service'

/**
 * Cookie 键名常量
 */
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const SESSION_TOKEN_KEY = 'session_token'
const USER_DATA_KEY = 'user_data'

/**
 * 认证用户接口
 * 匹配后端 User 实体的数据结构（排除敏感字段）
 */
export interface AuthUser extends SignInResponseData {
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
 * 认证状态接口
 */
interface AuthState {
  auth: {
    /**
     * 当前登录用户
     */
    user: AuthUser | null
    /**
     * 访问令牌
     */
    accessToken: string
    /**
     * 刷新令牌
     */
    refreshToken: string
    /**
     * 会话令牌
     */
    sessionToken: string
    /**
     * 设置用户数据
     */
    setUser: (user: AuthUser | null) => void
    /**
     * 设置访问令牌
     */
    setAccessToken: (token: string) => void
    /**
     * 设置刷新令牌
     */
    setRefreshToken: (token: string) => void
    /**
     * 设置会话令牌
     */
    setSessionToken: (token: string) => void
    /**
     * 设置所有令牌
     */
    setTokens: (tokens: {
      access_token: string
      refresh_token: string
      session_token: string
    }) => void
    /**
     * 清除访问令牌
     */
    resetAccessToken: () => void
    /**
     * 清除所有认证数据
     */
    reset: () => void
    /**
     * 检查是否已登录
     */
    isAuthenticated: () => boolean
  }
}

/**
 * 从 Cookie 读取令牌
 */
function getTokenFromCookie(key: string): string {
  const token = getCookie(key)
  return token || ''
}

/**
 * 保存令牌到 Cookie
 */
function setTokenToCookie(key: string, token: string): void {
  if (token) {
    // 设置 7 天过期（与刷新令牌过期时间一致）
    setCookie(key, token, 60 * 60 * 24 * 7)
  } else {
    removeCookie(key)
  }
}

/**
 * 从 Cookie 读取用户数据
 */
function getUserFromCookie(): AuthUser | null {
  const userData = getCookie(USER_DATA_KEY)
  if (userData) {
    try {
      return JSON.parse(userData) as AuthUser
    } catch {
      return null
    }
  }
  return null
}

/**
 * 保存用户数据到 Cookie
 */
function setUserToCookie(user: AuthUser | null): void {
  if (user) {
    setCookie(USER_DATA_KEY, JSON.stringify(user), 60 * 60 * 24 * 7)
  } else {
    removeCookie(USER_DATA_KEY)
  }
}

/**
 * 认证状态管理 Store
 * 使用 Zustand 管理用户认证状态和令牌
 */
export const useAuthStore = create<AuthState>()((set, get) => {
  // 从 Cookie 初始化状态
  const initAccessToken = getTokenFromCookie(ACCESS_TOKEN_KEY)
  const initRefreshToken = getTokenFromCookie(REFRESH_TOKEN_KEY)
  const initSessionToken = getTokenFromCookie(SESSION_TOKEN_KEY)
  const initUser = getUserFromCookie()

  return {
    auth: {
      user: initUser,
      accessToken: initAccessToken,
      refreshToken: initRefreshToken,
      sessionToken: initSessionToken,

      /**
       * 设置用户数据
       */
      setUser: (user) => {
        setUserToCookie(user)
        set((state) => ({ ...state, auth: { ...state.auth, user } }))
      },

      /**
       * 设置访问令牌
       */
      setAccessToken: (token) => {
        setTokenToCookie(ACCESS_TOKEN_KEY, token)
        set((state) => ({
          ...state,
          auth: { ...state.auth, accessToken: token },
        }))
      },

      /**
       * 设置刷新令牌
       */
      setRefreshToken: (token) => {
        setTokenToCookie(REFRESH_TOKEN_KEY, token)
        set((state) => ({
          ...state,
          auth: { ...state.auth, refreshToken: token },
        }))
      },

      /**
       * 设置会话令牌
       */
      setSessionToken: (token) => {
        setTokenToCookie(SESSION_TOKEN_KEY, token)
        set((state) => ({
          ...state,
          auth: { ...state.auth, sessionToken: token },
        }))
      },

      /**
       * 设置所有令牌
       */
      setTokens: (tokens) => {
        setTokenToCookie(ACCESS_TOKEN_KEY, tokens.access_token)
        setTokenToCookie(REFRESH_TOKEN_KEY, tokens.refresh_token)
        setTokenToCookie(SESSION_TOKEN_KEY, tokens.session_token)
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            sessionToken: tokens.session_token,
          },
        }))
      },

      /**
       * 清除访问令牌
       */
      resetAccessToken: () => {
        removeCookie(ACCESS_TOKEN_KEY)
        set((state) => ({
          ...state,
          auth: { ...state.auth, accessToken: '' },
        }))
      },

      /**
       * 清除所有认证数据
       */
      reset: () => {
        removeCookie(ACCESS_TOKEN_KEY)
        removeCookie(REFRESH_TOKEN_KEY)
        removeCookie(SESSION_TOKEN_KEY)
        removeCookie(USER_DATA_KEY)
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            user: null,
            accessToken: '',
            refreshToken: '',
            sessionToken: '',
          },
        }))
      },

      /**
       * 检查是否已登录
       */
      isAuthenticated: () => {
        const state = get()
        return !!(
          state.auth.accessToken &&
          state.auth.user &&
          state.auth.sessionToken
        )
      },
    },
  }
})
