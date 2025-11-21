import { EnvConfig } from '@/common/utils/validateEnv';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';

/**
 * 预定义的邮件服务名称列表。
 *
 * @description 这些服务名可以直接使用 service 字段配置，nodemailer 会自动处理连接参数。
 */
const PREDEFINED_SERVICES = [
  'gmail',
  'outlook',
  'yahoo',
  'hotmail',
  'qq',
  '163',
  '126',
  'sina',
  'sohu',
];

/**
 * Nodemailer 邮件服务模块。
 *
 * @description 配置和提供基于 Nodemailer 的邮件服务。
 * 使用环境变量设置邮件传输配置，支持预定义服务名和自定义 SMTP 服务器。
 * 与 TypedConfigModule 集成，实现动态配置。
 *
 * 配置逻辑：
 * - 如果 MAIL_HOST 是预定义服务名（如 'gmail', 'outlook'），使用 service 字段
 * - 否则使用 host + port 配置自定义 SMTP 服务器
 */
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [EnvConfig],
      useFactory: (config: EnvConfig) => {
        const isTest = config.NODE_ENV === 'test';
        const mailHost = config.MAIL_HOST;
        const isPredefinedService = PREDEFINED_SERVICES.includes(
          mailHost.toLowerCase(),
        );

        // 根据 MAIL_HOST 是否为预定义服务名，选择不同的配置方式
        const transport = isPredefinedService
          ? {
              service: mailHost,
              auth: {
                user: config.MAIL_USERNAME,
                pass: config.MAIL_PASSWORD,
              },
            }
          : {
              host: mailHost,
              port: config.MAIL_PORT,
              secure: config.MAIL_SECURE,
              auth: {
                user: config.MAIL_USERNAME,
                pass: config.MAIL_PASSWORD,
              },
            };

        return {
          transport: {
            ...transport,
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
