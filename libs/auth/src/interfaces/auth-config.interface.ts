/**
 * 认证配置接口。
 *
 * @description 定义认证模块所需的配置选项，包括 JWT 令牌的密钥和过期时间。
 * 支持可选的用户负载提取器，用于自定义从 JWT 负载中提取用户信息的方式。
 *
 * @property {string} accessTokenSecret - 访问令牌的密钥
 * @property {string | number} accessTokenExpiration - 访问令牌过期时间（如：'15m', '1h' 或秒数）
 * @property {string} refreshTokenSecret - 刷新令牌的密钥
 * @property {string | number} refreshTokenExpiration - 刷新令牌过期时间（如：'7d', '30d' 或秒数）
 * @property {(payload: any) => any} [extractUserFromPayload] - 可选的用户负载提取器
 *
 * @example
 * ```typescript
 * const config: AuthConfig = {
 *   accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
 *   accessTokenExpiration: '15m',
 *   refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
 *   refreshTokenExpiration: '7d',
 *   extractUserFromPayload: (payload) => ({
 *     id: payload.id,
 *     username: payload.username,
 *     email: payload.email,
 *     role: payload.role,
 *   }),
 * };
 * ```
 */
export type AuthConfig = {
  /**
   * 访问令牌的密钥。
   *
   * @type {string}
   */
  accessTokenSecret: string;

  /**
   * 访问令牌过期时间。
   *
   * @description 可以是字符串（如：'15m', '1h'）或数字（秒数）。
   *
   * @type {string | number}
   */
  accessTokenExpiration: string | number;

  /**
   * 刷新令牌的密钥。
   *
   * @type {string}
   */
  refreshTokenSecret: string;

  /**
   * 刷新令牌过期时间。
   *
   * @description 可以是字符串（如：'7d', '30d'）或数字（秒数）。
   *
   * @type {string | number}
   */
  refreshTokenExpiration: string | number;

  /**
   * 可选的用户负载提取器。
   *
   * @description 用于自定义从 JWT 负载中提取用户信息的方式。
   * 如果未提供，则直接将 JWT 负载作为用户信息。
   *
   * @param {unknown} payload - JWT 负载
   * @returns {unknown} 用户信息
   *
   * @example
   * ```typescript
   * extractUserFromPayload: (payload) => ({
   *   id: payload.id,
   *   username: payload.username,
   *   email: payload.email,
   *   role: payload.role,
   * }),
   * ```
   */
  extractUserFromPayload?: (payload: unknown) => unknown;
};
