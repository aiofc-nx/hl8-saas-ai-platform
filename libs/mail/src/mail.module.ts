import { DynamicModule, Module } from '@nestjs/common';
import { MAIL_CONFIG, MailConfig } from './interfaces/mail-config.interface.js';
import { MailService } from './services/mail.service.js';

/**
 * 邮件功能模块。
 *
 * @description 提供邮件发送服务。
 * 注意：使用方需要先配置 MailerModule（通过 NodeMailerModule 或自定义配置），
 * 并提供符合 MailConfig 接口的配置类。
 *
 * @example
 * ```typescript
 * // 在应用模块中导入
 * @Module({
 *   imports: [
 *     MailModule.forRoot(EnvConfig), // EnvConfig 需要实现 MailConfig 接口
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class MailModule {
  /**
   * 创建邮件模块。
   *
   * @description 注册邮件服务，需要提供符合 MailConfig 接口的配置类。
   * 配置类应该通过 @hl8/config 的 TypedConfigModule 注册为提供者。
   *
   * @param {new () => MailConfig} configClass - 配置类，需要实现 MailConfig 接口。
   * @returns {DynamicModule} 动态模块，包含 MailService 提供者。
   */
  static forRoot<T extends MailConfig>(
    configClass: new () => T,
  ): DynamicModule {
    return {
      module: MailModule,
      providers: [
        MailService,
        {
          provide: MAIL_CONFIG,
          useExisting: configClass,
        },
      ],
      exports: [MailService],
      global: true,
    };
  }
}
