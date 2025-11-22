/**
 * 认证配置提供者的注入令牌。
 *
 * @description 用于在 NestJS 依赖注入容器中标识认证配置提供者。
 * 应用层通过此令牌注入认证配置。
 *
 * @type {string}
 */
export const AUTH_CONFIG: string = 'AUTH_CONFIG';

/**
 * 会话验证器提供者的注入令牌。
 *
 * @description 用于在 NestJS 依赖注入容器中标识会话验证器提供者。
 * 应用层可以实现 SessionVerifier 接口并通过此令牌注册。
 *
 * @type {string}
 */
export const SESSION_VERIFIER: string = 'SESSION_VERIFIER';
