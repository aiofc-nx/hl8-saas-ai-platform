/**
 * JWT 令牌负载接口。
 *
 * @description 表示 JWT 令牌中包含的用户信息。
 * 认证守卫会将 JWT 负载解码后附加到请求对象。
 *
 * @property {string} id - 用户唯一标识符
 * @property {string} [username] - 用户名（可选）
 * @property {string} [email] - 邮箱地址（可选）
 * @property {string} [role] - 用户角色（可选）
 * @property {[key: string]: any} - 其他负载属性
 *
 * @example
 * ```typescript
 * // JWT 负载示例
 * {
 *   id: "user-123",
 *   username: "john_doe",
 *   email: "john@example.com",
 *   role: "ADMIN",
 *   iat: 1234567890,
 *   exp: 1234571490
 * }
 * ```
 */
export interface IJwtPayload {
  /**
   * 用户唯一标识符。
   *
   * @type {string}
   */
  id: string;

  /**
   * 用户名（可选）。
   *
   * @type {string}
   */
  username?: string;

  /**
   * 邮箱地址（可选）。
   *
   * @type {string}
   */
  email?: string;

  /**
   * 用户角色（可选）。
   *
   * @type {string}
   */
  role?: string;

  /**
   * 其他负载属性。
   *
   * @type {unknown}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
