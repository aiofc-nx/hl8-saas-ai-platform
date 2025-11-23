/**
 * @packageDocumentation
 * @description 邮件发送服务模块统一入口，导出邮件服务、模块和模板。
 */

export { MAIL_CONFIG } from './interfaces/mail-config.interface.js';
export type { MailConfig } from './interfaces/mail-config.interface.js';
export * from './mail.module.js';
export * from './services/mail.service.js';
export * from './templates/index.js';
