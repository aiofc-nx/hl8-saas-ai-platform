import { GeneralUnauthorizedException } from '@hl8/exceptions';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  AUTH_CONFIG,
  SESSION_VERIFIER,
} from '../constants/auth-tokens.constants.js';
import type { AuthConfig } from '../interfaces/auth-config.interface.js';
import type { SessionVerifier } from '../interfaces/session-verifier.interface.js';

/**
 * JWT 刷新令牌守卫，用于在 NestJS 应用中验证刷新令牌。
 *
 * @description 通过验证刷新令牌的有效性来实现基于刷新令牌的认证。
 * 用于令牌刷新端点，确保只有有效的刷新令牌才能用于生成新的访问令牌。
 * 验证包括：
 * - JWT 令牌签名和有效性
 * - 可选的会话记录验证（如果提供了会话验证器）
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @UseGuards(JwtRefreshGuard)
 * @Post('refresh')
 * refreshToken() { }
 * ```
 */
@Injectable()
export class JwtRefreshGuard implements CanActivate {
  /**
   * 创建 JwtRefreshGuard 实例。
   *
   * @param jwtService - JWT 服务，用于 JWT 令牌操作（验证、解码）。
   * @param config - 认证配置，用于访问环境变量。
   * @param sessionVerifier - 可选的会话验证器，用于验证会话记录是否存在。
   */
  constructor(
    private jwtService: JwtService,
    @Inject(AUTH_CONFIG) private config: AuthConfig,
    @Optional()
    @Inject(SESSION_VERIFIER)
    private sessionVerifier?: SessionVerifier,
  ) {}

  /**
   * 基于刷新令牌验证确定当前请求是否应该被允许继续。
   *
   * @description 通过以下步骤执行认证：
   * - 从请求头提取刷新令牌
   * - 验证令牌签名和有效性
   * - 如果提供了会话验证器，检查数据库中是否存在对应的会话记录
   * - 将用户负载附加到请求对象
   *
   * @param context - 包含请求/响应信息的执行上下文。
   * @returns 如果刷新令牌认证成功，解析为 true 的 Promise。
   * @throws {UnauthorizedException} 如果令牌缺失、无效或会话不存在。
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new GeneralUnauthorizedException(
        '缺少刷新令牌，请先登录',
        'MISSING_REFRESH_TOKEN',
      );
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.refreshTokenSecret,
      });
      // 如果提供了自定义提取器，使用它；否则直接使用负载
      request.user = this.config.extractUserFromPayload
        ? this.config.extractUserFromPayload(payload)
        : payload;
    } catch (_error) {
      throw new GeneralUnauthorizedException(
        '刷新令牌无效或已过期',
        'INVALID_REFRESH_TOKEN',
      );
    }

    // 如果提供了会话验证器，验证会话是否存在
    if (this.sessionVerifier) {
      const isValidSession = await this.sessionVerifier.verifySession(
        token,
        request.user.id,
      );
      if (!isValidSession) {
        throw new GeneralUnauthorizedException(
          '刷新令牌对应的会话不存在',
          'SESSION_NOT_FOUND',
        );
      }
    }

    return true;
  }

  /**
   * 从 Authorization 头中提取 JWT 刷新令牌。
   *
   * @description 解析 Authorization 头，期望 "Bearer <token>" 格式，并验证授权类型。
   *
   * @param request - 包含请求头的 Express 请求对象。
   * @returns 如果找到且有效，返回 JWT 刷新令牌字符串；否则返回 undefined。
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
