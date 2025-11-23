/**
 * Cookie 工具函数
 * 使用手动 document.cookie 方式实现，替代 js-cookie 依赖以获得更好的一致性
 */

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 天

/**
 * 根据名称获取 Cookie 值
 *
 * @param name - Cookie 名称
 * @returns Cookie 值，如果不存在则返回 undefined
 *
 * @remarks
 * 在服务端渲染环境中（如 SSR），如果 document 未定义，将返回 undefined
 *
 * @example
 * ```ts
 * const token = getCookie('auth_token')
 * ```
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue
  }
  return undefined
}

/**
 * 设置 Cookie
 *
 * @param name - Cookie 名称
 * @param value - Cookie 值
 * @param maxAge - 最大存活时间（秒），默认为 7 天
 *
 * @remarks
 * 在服务端渲染环境中（如 SSR），如果 document 未定义，将不执行任何操作
 * Cookie 将设置路径为根路径（path=/）
 *
 * @example
 * ```ts
 * setCookie('auth_token', 'abc123', 3600) // 1 小时
 * setCookie('user_pref', 'dark') // 使用默认 7 天
 * ```
 */
export function setCookie(
  name: string,
  value: string,
  maxAge: number = DEFAULT_MAX_AGE
): void {
  if (typeof document === 'undefined') return

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`
}

/**
 * 删除 Cookie
 * 通过将 max-age 设置为 0 来删除指定的 Cookie
 *
 * @param name - 要删除的 Cookie 名称
 *
 * @remarks
 * 在服务端渲染环境中（如 SSR），如果 document 未定义，将不执行任何操作
 *
 * @example
 * ```ts
 * removeCookie('auth_token')
 * ```
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return

  document.cookie = `${name}=; path=/; max-age=0`
}
