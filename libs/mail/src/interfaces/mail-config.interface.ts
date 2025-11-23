/**
 * 邮件配置接口。
 *
 * @description 定义邮件服务所需的配置项。
 * 使用方需要提供包含 MAIL_USERNAME 的配置对象。
 */
export interface MailConfig {
  /**
   * 邮件用户名（发件人邮箱地址）。
   */
  readonly MAIL_USERNAME: string;
}

/**
 * MailConfig 注入 token。
 *
 * @description 用于依赖注入的 token。
 */
export const MAIL_CONFIG = Symbol('MAIL_CONFIG');
