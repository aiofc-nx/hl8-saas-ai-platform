import { Logger } from '@hl8/logger';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { APP_NAME } from '@repo/constants/app';
import type { MailConfig } from '../interfaces/mail-config.interface.js';
import { MAIL_CONFIG } from '../interfaces/mail-config.interface.js';

/**
 * 邮件服务。
 *
 * @description 提供邮件发送功能，封装了 MailerService 的调用。
 * 负责设置默认发件人地址，并记录邮件发送过程中的错误。
 * 对于QQ邮箱和163邮箱等严格验证发件人地址的服务，自动使用纯邮箱地址作为发件人。
 */
@Injectable()
export class MailService {
  /**
   * 创建 MailService 实例。
   *
   * @param {MailerService} mailerService - 邮件发送服务实例。
   * @param {MailConfig} config - 邮件配置，用于获取发件人邮箱地址。
   * 配置通过依赖注入提供，需要实现 MailConfig 接口。
   * @param {Logger} logger - 日志服务实例。
   */
  constructor(
    private readonly mailerService: MailerService,
    @Inject(MAIL_CONFIG) private readonly config: MailConfig,
    private readonly logger: Logger,
  ) {}

  /**
   * 发送邮件。
   *
   * @description 使用配置的邮件服务发送邮件。
   * 自动设置发件人地址，并记录发送过程中的错误。
   * 对于QQ邮箱和163邮箱等严格验证发件人地址的服务，使用纯邮箱地址作为发件人。
   *
   * @param {ISendMailOptions} mailOptions - 邮件选项，包括收件人、主题、内容等。
   * @returns {Promise<void>} 发送成功时返回，失败时抛出异常。
   * @throws {Error} 当邮件发送失败时抛出错误。
   *
   * @example
   * ```typescript
   * await mailService.sendEmail({
   *   to: ['user@example.com'],
   *   subject: 'Welcome',
   *   html: '<h1>Welcome!</h1>',
   * });
   * ```
   */
  async sendEmail(mailOptions: ISendMailOptions): Promise<void> {
    try {
      // 检测是否为QQ邮箱或其他需要严格验证发件人地址的服务
      const isQQMail = this.config.MAIL_USERNAME.includes('@qq.com');
      const is163Mail =
        this.config.MAIL_USERNAME.includes('@163.com') ||
        this.config.MAIL_USERNAME.includes('@126.com');
      const isStrictMail = isQQMail || is163Mail;

      // 对于QQ邮箱和163邮箱，使用纯邮箱地址作为发件人，避免退信
      // 其他邮箱服务可以使用带名称的格式
      const fromAddress = isStrictMail
        ? this.config.MAIL_USERNAME
        : `${APP_NAME} <${this.config.MAIL_USERNAME}>`;

      await this.mailerService.sendMail({
        from: fromAddress,
        ...mailOptions,
      });
      this.logger.debug('邮件发送成功', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: fromAddress,
      });
    } catch (error) {
      this.logger.error('邮件发送失败', {
        error: error instanceof Error ? error.message : String(error),
        to: mailOptions.to,
        subject: mailOptions.subject,
        stack: error instanceof Error ? error.stack : undefined,
      });
      // 重新抛出错误，让调用方处理
      throw error;
    }
  }
}
