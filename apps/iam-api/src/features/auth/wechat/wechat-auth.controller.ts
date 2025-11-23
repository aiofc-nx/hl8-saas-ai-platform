import { EnvConfig } from '@/common/utils/validateEnv';
import { User as UserEntity } from '@/features/users/entities/user.entity';
import { Public, User } from '@hl8/auth/decorators';
import { JwtAuthGuard } from '@hl8/auth/guards';
import { GeneralBadRequestException } from '@hl8/exceptions';
import { Controller, Get, Inject, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { WechatQrcodeResponseDto, WechatStatusResponseDto } from './dto';
import { WechatAuthService } from './wechat-auth.service';

/**
 * 微信认证控制器。
 *
 * @description 提供微信扫码登录相关的 API 端点，包括：
 * - 生成登录二维码
 * - 处理微信授权回调
 * - 查询登录状态
 */
@Controller('auth/wechat')
export class WechatAuthController {
  constructor(
    private readonly wechatAuthService: WechatAuthService,
    @Inject(EnvConfig) private readonly config: EnvConfig,
  ) {}

  /**
   * 生成微信登录二维码。
   *
   * @description 生成唯一的登录票据和微信授权 URL，用于前端生成二维码。
   *
   * @returns {Promise<WechatQrcodeResponseDto>} 包含 ticket 和二维码 URL 的对象
   *
   * @example
   * ```typescript
   * // 前端请求
   * GET /auth/wechat/qrcode
   *
   * // 响应
   * {
   *   "ticket": "uuid-here",
   *   "qrcodeUrl": "https://open.weixin.qq.com/...",
   *   "expiresIn": 300
   * }
   * ```
   */
  @Public()
  @Get('qrcode')
  async generateQrcode(): Promise<WechatQrcodeResponseDto> {
    return this.wechatAuthService.generateQrcode();
  }

  /**
   * 微信授权回调。
   *
   * @description 处理微信授权后的回调请求，使用授权码换取用户信息并完成登录。
   *
   * @param {string} code - 微信授权码
   * @param {string} state - 状态码（登录票据 ticket）
   * @param {Response} res - Express 响应对象，用于重定向
   *
   * @example
   * ```typescript
   * // 微信回调
   * GET /auth/wechat/callback?code=xxx&state=ticket-uuid
   *
   * // 成功：重定向到前端成功页面
   * // 失败：重定向到前端错误页面
   * ```
   */
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.wechatAuthService.handleCallback(code, state);

      // 重定向到前端成功页面（前端需要开始轮询获取结果）
      const frontendUrl = this.config.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/wechat/success?ticket=${state}`);
    } catch (error) {
      // 重定向到错误页面
      const frontendUrl = this.config.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/wechat/error?ticket=${state}`);
    }
  }

  /**
   * 获取登录状态。
   *
   * @description 前端轮询调用此接口检查登录状态，获取登录结果。
   *
   * @param {string} ticket - 登录票据
   * @returns {Promise<WechatStatusResponseDto>} 登录状态和结果
   *
   * @example
   * ```typescript
   * // 前端轮询请求
   * GET /auth/wechat/status?ticket=uuid-here
   *
   * // 响应（未扫描）
   * {
   *   "status": "pending",
   *   "ticket": "uuid-here"
   * }
   *
   * // 响应（已扫描，登录成功）
   * {
   *   "status": "success",
   *   "ticket": "uuid-here",
   *   "data": {
   *     "user": { ... },
   *     "tokens": {
   *       "access_token": "...",
   *       "refresh_token": "..."
   *     }
   *   }
   * }
   *
   * // 响应（已扫描，登录失败）
   * {
   *   "status": "failed",
   *   "ticket": "uuid-here",
   *   "error": "授权失败或用户拒绝"
   * }
   * ```
   */
  @Public()
  @Get('status')
  async getStatus(
    @Query('ticket') ticket: string,
  ): Promise<WechatStatusResponseDto> {
    return this.wechatAuthService.getLoginStatus(ticket);
  }

  /**
   * 生成绑定微信二维码。
   *
   * @description 已登录用户生成绑定微信账号的二维码。
   * 需要用户已登录（通过 JWT 认证）。
   *
   * @returns {Promise<WechatQrcodeResponseDto>} 包含 ticket 和二维码 URL 的对象
   *
   * @example
   * ```typescript
   * // 已登录用户请求
   * GET /auth/wechat/bind-qrcode
   * Authorization: Bearer <access_token>
   *
   * // 响应
   * {
   *   "ticket": "uuid-here",
   *   "qrcodeUrl": "https://open.weixin.qq.com/...",
   *   "expiresIn": 300
   * }
   * ```
   */
  @UseGuards(JwtAuthGuard)
  @Get('bind-qrcode')
  async generateBindQrcode(
    @User() user: UserEntity,
  ): Promise<WechatQrcodeResponseDto> {
    // 检查用户是否已绑定微信
    if (user.wechatOpenid) {
      throw new GeneralBadRequestException(
        [{ field: 'wechat', message: '用户已绑定微信账号' }],
        '用户已绑定微信账号，无需重复绑定',
        'WECHAT_ALREADY_BOUND',
      );
    }

    return this.wechatAuthService.generateQrcode(user.id);
  }
}
