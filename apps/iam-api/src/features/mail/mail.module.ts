import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';

/**
 * 邮件功能模块。
 *
 * @description 提供邮件发送服务。
 * 注意：MailerModule 已在 NodeMailerModule 中全局配置，此处无需重复导入。
 */
@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
