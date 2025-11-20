import { SetMetadata } from '@nestjs/common';

/**
 * 用于将路由标记为公共（无需认证）的元数据键。
 *
 * @type {string}
 */
export const IS_PUBLIC_KEY: string = 'isPublic';

/**
 * 自定义装饰器，用于将路由或控制器标记为公共。
 *
 * @description 应用此装饰器时，将 'isPublic' 元数据设置为 true，
 * 允许守卫（如认证守卫）绕过该路由的认证检查。
 * 与 JwtAuthGuard 配合使用，标记不需要 JWT 认证的公共端点。
 *
 * @returns {MethodDecorator & ClassDecorator} 用于设置公共元数据的装饰器函数。
 *
 * @example
 * ```typescript
 * // 在控制器方法上使用
 * @Public()
 * @Post('login')
 * login() { }
 *
 * // 在控制器类上使用，使整个控制器为公共
 * @Public()
 * @Controller('public')
 * export class PublicController { }
 * ```
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
