import { EnvConfig } from '@/common/utils/validateEnv';
import { Session } from '@/features/auth/entities/session.entity';
import { User } from '@/features/users/entities/user.entity';
import {
  GeneralBadRequestException,
  GeneralUnauthorizedException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { InjectRepository } from '@hl8/mikro-orm-nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';
import { WechatLoginTicket } from './entities/wechat-login-ticket.entity';
import { WechatUserInfo } from './interfaces/wechat-user.interface';

/**
 * 微信认证服务。
 *
 * @description 处理微信扫码登录的完整流程，包括：
 * - 生成登录二维码
 * - 处理微信回调
 * - 获取用户信息
 * - 创建或绑定用户
 * - 生成 JWT 令牌
 */
@Injectable()
export class WechatAuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: EnvConfig,
    private readonly authService: AuthService,
    @InjectRepository(WechatLoginTicket)
    private readonly ticketRepository: EntityRepository<WechatLoginTicket>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly logger: Logger,
  ) {}

  /**
   * 生成微信登录二维码。
   *
   * @param userId - 可选的用户 ID（用于绑定模式）
   * @returns 包含 ticket 和二维码 URL 的对象
   */
  async generateQrcode(userId?: string): Promise<{
    ticket: string;
    qrcodeUrl: string;
    expiresIn: number;
  }> {
    // 1. 生成唯一 ticket
    const ticket = randomUUID();

    // 2. 创建微信授权 URL
    const redirectUri = encodeURIComponent(this.config.WECHAT_REDIRECT_URI);
    const state = ticket; // 使用 ticket 作为 state
    const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${this.config.WECHAT_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

    // 3. 生成二维码图片 URL
    // 注意：实际项目中，可以使用 qrcode 库生成二维码图片，或使用在线服务
    // 这里返回授权 URL，前端可以使用该 URL 生成二维码
    const qrcodeUrl = authUrl;

    // 4. 保存 ticket 到数据库
    const ticketEntity = new WechatLoginTicket();
    ticketEntity.ticket = ticket;
    ticketEntity.status = 'pending';
    ticketEntity.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟过期
    // 如果是绑定模式，保存用户 ID
    if (userId) {
      ticketEntity.userId = userId;
    }

    const em = this.ticketRepository.getEntityManager();
    em.persist(ticketEntity);
    await em.flush();

    this.logger.log('生成微信登录二维码', {
      ticket,
      expiresAt: ticketEntity.expiresAt,
      userId,
      mode: userId ? 'bind' : 'login',
    });

    return {
      ticket,
      qrcodeUrl,
      expiresIn: 300, // 5 分钟
    };
  }

  /**
   * 处理微信回调。
   *
   * @param code - 微信授权码
   * @param state - 状态码（ticket）
   * @returns Promise<void>
   */
  async handleCallback(code: string, state: string): Promise<void> {
    // 1. 验证 ticket
    const ticket = await this.ticketRepository.findOne({ ticket: state });
    if (!ticket) {
      throw new GeneralBadRequestException(
        [{ field: 'ticket', message: '无效的登录票据' }],
        '无效的登录票据',
        'INVALID_TICKET',
      );
    }

    if (ticket.status !== 'pending') {
      throw new GeneralBadRequestException(
        [{ field: 'ticket', message: '登录票据已使用' }],
        '登录票据已使用',
        'TICKET_USED',
      );
    }

    if (ticket.expiresAt < new Date()) {
      throw new GeneralBadRequestException(
        [{ field: 'ticket', message: '登录票据已过期' }],
        '登录票据已过期',
        'TICKET_EXPIRED',
      );
    }

    // 2. 更新 ticket 状态
    ticket.status = 'scanned';
    ticket.code = code;

    try {
      // 3. 使用 code 换取 access_token
      const tokenResponse = await firstValueFrom(
        this.httpService.get(
          'https://api.weixin.qq.com/sns/oauth2/access_token',
          {
            params: {
              appid: this.config.WECHAT_APP_ID,
              secret: this.config.WECHAT_APP_SECRET,
              code,
              grant_type: 'authorization_code',
            },
          },
        ),
      );

      if (tokenResponse.data.errcode) {
        throw new GeneralUnauthorizedException(
          `微信授权失败: ${tokenResponse.data.errmsg}`,
          'WECHAT_AUTH_FAILED',
        );
      }

      const { access_token, openid } = tokenResponse.data;

      // 4. 使用 access_token 和 openid 获取用户信息
      const userInfoResponse = await firstValueFrom(
        this.httpService.get('https://api.weixin.qq.com/sns/userinfo', {
          params: {
            access_token,
            openid,
            lang: 'zh_CN',
          },
        }),
      );

      if (userInfoResponse.data.errcode) {
        throw new GeneralUnauthorizedException(
          `获取微信用户信息失败: ${userInfoResponse.data.errmsg}`,
          'WECHAT_USER_INFO_FAILED',
        );
      }

      const userInfo: WechatUserInfo = userInfoResponse.data;
      ticket.openid = openid;
      ticket.userInfo = userInfo;

      // 5. 查找或创建用户
      let user = await this.userRepository.findOne(
        { wechatOpenid: openid },
        { populate: ['profile'] },
      );

      // 6. 如果是绑定模式（ticket 中有 userId）
      if (!user && ticket.userId) {
        // 绑定模式：绑定到已存在的用户
        user = await this.userRepository.findOne(
          { id: ticket.userId },
          { populate: ['profile'] },
        );

        if (!user) {
          throw new GeneralBadRequestException(
            [{ field: 'user', message: '用户不存在' }],
            '用户不存在，无法绑定微信',
            'USER_NOT_FOUND',
          );
        }

        // 检查微信账号是否已被其他用户绑定
        const existingBinding = await this.userRepository.findOne({
          wechatOpenid: openid,
        });

        if (existingBinding && existingBinding.id !== user.id) {
          throw new GeneralBadRequestException(
            [{ field: 'wechat', message: '微信账号已被其他用户绑定' }],
            '微信账号已被其他用户绑定',
            'WECHAT_ALREADY_BOUND',
          );
        }

        // 绑定微信账号
        user.wechatOpenid = openid;
        const em = this.userRepository.getEntityManager();
        await em.flush();

        this.logger.log('微信账号绑定成功', {
          openid,
          userId: user.id,
          ticket: state,
        });
      } else if (!user) {
        // 登录模式：创建新用户
        user = await this.authService.createWechatUser(openid, userInfo);
      }

      // 6. 生成 JWT 令牌（复用 AuthService 的逻辑）
      const tokens = await this.authService.generateTokens(user);

      // 7. 创建会话
      const session = new Session();
      session.user = user;
      session.refresh_token = tokens.refresh_token;
      session.ip = 'unknown'; // 微信登录没有 IP 信息
      session.device_name = 'WeChat';
      session.device_os = 'unknown';
      session.browser = 'WeChat';
      session.location = userInfo.country || 'unknown';
      session.userAgent = 'WeChat';

      const em = this.userRepository.getEntityManager();
      em.persist(session);
      await em.flush();

      // 8. 更新 ticket
      ticket.userId = user.id;
      ticket.status = 'success';
      ticket.tokens = tokens;
      ticket.user = user;

      await em.flush();

      this.logger.log('微信扫码登录成功', {
        openid,
        userId: user.id,
        ticket: state,
      });
    } catch (error) {
      // 处理错误
      ticket.status = 'failed';
      ticket.error = error instanceof Error ? error.message : '未知错误';
      const em = this.ticketRepository.getEntityManager();
      await em.flush();

      this.logger.error('微信扫码登录失败', {
        code,
        state,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 获取登录状态。
   *
   * @param ticket - 登录票据
   * @returns 登录状态和结果
   */
  async getLoginStatus(ticket: string): Promise<{
    status: 'pending' | 'scanned' | 'success' | 'failed';
    ticket: string;
    data?: {
      user: User;
      tokens: {
        access_token: string;
        refresh_token: string;
      };
    };
    error?: string;
  }> {
    const ticketEntity = await this.ticketRepository.findOne(
      { ticket },
      { populate: ['user'] },
    );

    if (!ticketEntity) {
      throw new GeneralBadRequestException(
        [{ field: 'ticket', message: '无效的登录票据' }],
        '无效的登录票据',
        'INVALID_TICKET',
      );
    }

    if (ticketEntity.expiresAt < new Date()) {
      throw new GeneralBadRequestException(
        [{ field: 'ticket', message: '登录票据已过期' }],
        '登录票据已过期',
        'TICKET_EXPIRED',
      );
    }

    return {
      status: ticketEntity.status,
      ticket: ticketEntity.ticket,
      data:
        ticketEntity.status === 'success' &&
        ticketEntity.user &&
        ticketEntity.tokens
          ? {
              user: ticketEntity.user,
              tokens: ticketEntity.tokens,
            }
          : undefined,
      error: ticketEntity.error,
    };
  }
}
