/**
 * 用于将路由标记为公共（无需认证）的元数据键。
 *
 * @description 与 @Public() 装饰器配合使用，标记不需要 JWT 认证的公共端点。
 *
 * @type {string}
 */
export const IS_PUBLIC_KEY: string = 'isPublic';

/**
 * 用于存储路由或控制器所需角色的元数据键。
 *
 * @description 与 @Roles() 装饰器配合使用，设置路由或控制器的角色元数据。
 *
 * @type {string}
 */
export const ROLES_KEY: string = 'roles';
