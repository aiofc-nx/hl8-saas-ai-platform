import { EnvConfig } from '@/common/utils/validateEnv';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { APP_NAME } from '@repo/constants/app';

/**
 * 邮件服务。
 *
 * @description 提供邮件发送功能，封装了 MailerService 的调用。
 * 负责设置默认发件人地址，并记录邮件发送过程中的错误。
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * 创建 MailService 实例。
   *
   * @param {MailerService} mailerService - 邮件发送服务实例。
   * @param {EnvConfig} config - 环境配置，用于访问环境变量。
   */
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: EnvConfig,
  ) {}

  /**
   * 发送邮件。
   *
   * @description 使用配置的邮件服务发送邮件。
   * 自动设置发件人地址，并记录发送过程中的错误。
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
      await this.mailerService.sendMail({
        from: `${APP_NAME}<${this.config.MAIL_USERNAME}>`,
        ...mailOptions,
      });
      this.logger.debug('邮件发送成功', {
        to: mailOptions.to,
        subject: mailOptions.subject,
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
