import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/metadata-keys.constants.js';
import { Role } from '../types/role.type.js';

/**
 * 装饰器，用于指定路由或控制器所需的角色。
 *
 * @description 设置路由或控制器的角色元数据，与 RolesGuard 配合使用实现基于角色的访问控制。
 * 可以同时指定多个角色，用户只需拥有其中一个角色即可访问。
 *
 * @param {Role[]} roles - 允许访问路由的角色数组。
 * @returns {MethodDecorator & ClassDecorator} 用于设置角色元数据的装饰器函数。
 *
 * @example
 * ```typescript
 * // 在控制器方法上使用
 * @Roles('ADMIN')
 * @Get('admin-only')
 * adminOnly() { }
 *
 * // 允许多个角色
 * @Roles('ADMIN', 'USER')
 * @Get('common')
 * common() { }
 * ```
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
