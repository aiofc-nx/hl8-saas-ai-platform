import { Env } from '@/common/utils';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Module for configuring and providing the Nodemailer-based mailer service.
 *
 * Sets up the mail transport using environment variables for host, username, and password.
 * Integrates with NestJS ConfigModule for dynamic configuration.
 */
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) => {
        const isTest = config.get('NODE_ENV') === 'test';
        return {
          transport: {
            service: config.get('MAIL_HOST'),
            auth: {
              user: config.get('MAIL_USERNAME'),
              pass: config.get('MAIL_PASSWORD'),
            },
            // 在测试环境中使用更短的超时时间，避免连接超时
            ...(isTest && {
              connectionTimeout: 1000, // 1 秒连接超时
              greetingTimeout: 1000, // 1 秒问候超时
              socketTimeout: 1000, // 1 秒 socket 超时
            }),
          },
        };
      },
    }),
  ],
})
export class NodeMailerModule {}
