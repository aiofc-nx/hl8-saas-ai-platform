import { Base } from '@/common/entities';
import { Entity, Enum, Property } from '@mikro-orm/postgresql';

/**
 * OTP 令牌类型枚举。
 */
export enum TokenTypes {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  EMAIL_CONFIRMATION = 'EMAIL_CONFIRMATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/**
 * 一次性密码（OTP）实体。
 *
 * @description 表示 OTP 验证码记录，用于：
 * - 邮箱验证
 * - 邮箱确认
 * - 密码重置
 *
 * @property {string} otp - OTP 验证码
 * @property {Date} expires - OTP 过期时间
 * @property {TokenTypes} type - OTP 令牌类型
 */
@Entity()
export class Otp extends Base {
  /**
   * OTP 验证码。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: false })
  otp!: string;

  /**
   * OTP 过期时间。
   *
   * @type {Date}
   */
  @Property({ type: 'timestamp', nullable: false })
  expires!: Date;

  /**
   * OTP 令牌类型。
   *
   * @type {TokenTypes}
   */
  @Enum(() => TokenTypes)
  type!: TokenTypes;
}
