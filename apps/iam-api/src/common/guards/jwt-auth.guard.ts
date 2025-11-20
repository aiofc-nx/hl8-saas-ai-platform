import { IS_PUBLIC_KEY } from '@/common/decorators';
import { Env } from '@/common/utils';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * JWT 认证守卫，用于保护 NestJS 应用中的路由。
 *
 * @description 通过验证 Authorization 头中的访问令牌实现基于 JWT 的认证。
 * 支持通过 @Public() 装饰器标记的公共路由，并自动将解码后的用户负载附加到请求对象。
 *
 * @example
 * ```typescript
 * // 默认情况下所有路由都需要认证
 * // 使用 @Public() 装饰器标记公共路由
 * @Public()
 * @Post('login')
 * login() { }
 * ```
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  /**
   * 创建 JwtAuthGuard 实例。
   *
   * @param jwtService - JWT 服务，用于 JWT 令牌操作（验证、解码）。
   * @param reflector - NestJS 工具，用于从装饰器读取元数据。
   * @param configService - 配置服务，用于访问环境变量。
   */
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService<Env>,
  ) {}

  /**
   * 确定当前请求是否应该被允许继续。
   *
   * @description 通过以下步骤执行认证：
   * - 检查是否为公共路由
   * - 从请求头提取 JWT 令牌
   * - 验证令牌有效性
   * - 将用户负载附加到请求对象
   *
   * @param context - 包含请求/响应信息的执行上下文。
   * @returns 如果认证成功，解析为 true 的 Promise。
   * @throws {UnauthorizedException} 如果令牌缺失或无效。
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      request.user = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid Access Token');
    }
    return true;
  }

  /**
   * 从 Authorization 头中提取 JWT 令牌。
   *
   * @description 解析 Authorization 头，期望 "Bearer <token>" 格式，并验证授权类型。
   *
   * @param request - 包含请求头的 Express 请求对象。
   * @returns 如果找到且有效，返回 JWT 令牌字符串；否则返回 undefined。
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
