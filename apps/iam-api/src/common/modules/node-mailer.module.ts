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
 * - 自动检测邮箱类型（QQ、163、126 等），根据邮箱类型自动调整端口和加密设置
 *   - 163/126 邮箱：自动使用 465 端口 + SSL
 *   - QQ 邮箱：自动使用 465 端口 + SSL
 *   - 其他邮箱：使用环境变量配置或默认 587 + STARTTLS
 * - 如果环境变量已设置，优先使用环境变量的值
 */
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [EnvConfig],
      useFactory: (config: EnvConfig) => {
        const isTest = config.NODE_ENV === 'test';
        const mailHost = config.MAIL_HOST.toLowerCase();
        const isPredefinedService = PREDEFINED_SERVICES.includes(mailHost);

        // 检测邮箱类型，自动调整配置
        const isQQMail = mailHost.includes('qq.com') || mailHost === 'qq';
        const is163Mail =
          mailHost.includes('163.com') ||
          mailHost.includes('126.com') ||
          mailHost === '163' ||
          mailHost === '126';

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
              host: config.MAIL_HOST,
              // 根据邮箱类型自动调整端口和加密设置
              // 如果环境变量已设置，使用环境变量的值；否则根据邮箱类型自动配置
              // 重要：确保端口和 secure 设置匹配
              // - 465 端口必须使用 secure: true (SSL)
              // - 587 端口必须使用 secure: false + requireTLS: true (STARTTLS)
              port: config.MAIL_PORT
                ? config.MAIL_PORT
                : is163Mail || isQQMail
                  ? 465 // 163 和 QQ 邮箱推荐使用 465 端口（SSL）
                  : 587, // 其他邮箱默认使用 587 端口（STARTTLS）
              // 根据端口自动设置 secure，确保配置匹配
              // 如果端口已设置，根据端口自动判断 secure（忽略环境变量中的 secure，避免配置冲突）
              // 如果端口未设置，使用环境变量或根据邮箱类型自动判断
              secure: (() => {
                const finalPort = config.MAIL_PORT
                  ? config.MAIL_PORT
                  : is163Mail || isQQMail
                    ? 465
                    : 587;
                // 如果端口是 465，必须使用 secure: true
                if (finalPort === 465) {
                  return true;
                }
                // 如果端口是 587，必须使用 secure: false
                if (finalPort === 587) {
                  return false;
                }
                // 其他端口，使用环境变量或默认值
                return config.MAIL_SECURE !== undefined
                  ? config.MAIL_SECURE
                  : is163Mail || isQQMail;
              })(),
              // 对于 587 端口（secure: false），需要明确启用 STARTTLS
              requireTLS: (() => {
                const finalPort = config.MAIL_PORT
                  ? config.MAIL_PORT
                  : is163Mail || isQQMail
                    ? 465
                    : 587;
                const finalSecure = (() => {
                  if (finalPort === 465) return true;
                  if (finalPort === 587) return false;
                  return config.MAIL_SECURE !== undefined
                    ? config.MAIL_SECURE
                    : is163Mail || isQQMail;
                })();
                // 只有在 secure: false 且端口是 587 时才启用 requireTLS
                return !finalSecure && finalPort === 587;
              })(),
              // 对于 587 端口，明确禁用立即 SSL 连接，使用 STARTTLS
              ignoreTLS: false,
              // 忽略证书验证错误（仅用于开发环境，生产环境应使用有效证书）
              tls: {
                rejectUnauthorized: false,
                // 明确指定 TLS 版本，避免版本不匹配问题
                minVersion: 'TLSv1.2',
                // 对于 QQ 邮箱 587 端口，确保使用 STARTTLS 而不是直接 SSL
                servername: config.MAIL_HOST,
              },
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
        } as any; // 类型断言：MailerOptions 的类型定义可能不完整
      },
    }),
  ],
})
export class NodeMailerModule {}
