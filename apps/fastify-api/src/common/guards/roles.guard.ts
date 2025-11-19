import { Role } from '@/common/constants';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/decorators';

/**
 * 角色守卫，用于在 NestJS 应用中强制执行基于角色的访问控制。
 *
 * @description 使用 @Roles() 装饰器设置的元数据来确定路由允许的角色。
 * 如果用户的角色匹配所需角色之一，或者用户是 SUPERADMIN，则授予访问权限。
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @Roles('ADMIN')
 * @Get('admin-only')
 * adminOnly() { }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * 创建 RolesGuard 实例。
   *
   * @param reflector - NestJS 工具，用于从装饰器读取元数据。
   */
  constructor(private reflector: Reflector) {}

  /**
   * 确定当前用户是否具有访问路由所需的角色。
   *
   * @description 检查所需角色元数据并将其与用户角色进行比较。
   * 如果用户是 SUPERADMIN，则自动授予访问权限。
   *
   * @param context - 包含请求/响应信息的执行上下文。
   * @returns 如果用户具有所需角色之一或是 SUPERADMIN，返回 true；否则返回 false。
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (user.role === 'SUPERADMIN') return true;

    return requiredRoles.some((role) => user.role === role);
  }
}
