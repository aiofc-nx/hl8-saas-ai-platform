import { Base } from '@/common/entities';
import type { AuthTokensInterface } from '@/common/interfaces';
import { User } from '@/features/users/entities/user.entity';
import type { Rel } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, Property } from '@mikro-orm/postgresql';
import type { WechatUserInfo } from '../interfaces/wechat-user.interface';

/**
 * 微信登录票据实体。
 *
 * @description 用于管理微信扫码登录的状态和流程，包含：
 * - 登录票据（ticket）和状态
 * - 微信授权码和用户信息
 * - 生成的 JWT 令牌
 * - 关联的系统用户
 *
 * @property {string} ticket - 唯一登录票据
 * @property {string} code - 微信授权码
 * @property {string} openid - 微信用户 openid
 * @property {WechatUserInfo} userInfo - 微信用户信息
 * @property {string} userId - 绑定的系统用户 ID
 * @property {'pending' | 'scanned' | 'success' | 'failed'} status - 状态
 * @property {string} error - 错误信息
 * @property {AuthTokensInterface} tokens - 生成的 JWT 令牌
 * @property {Date} expiresAt - 过期时间
 * @property {Rel<User>} user - 关联的用户
 */
@Entity()
export class WechatLoginTicket extends Base {
  /**
   * 唯一登录票据。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', unique: true, nullable: false })
  ticket!: string;

  /**
   * 微信授权码。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true })
  code?: string;

  /**
   * 微信用户 openid。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, unique: true })
  openid?: string;

  /**
   * 微信用户信息。
   *
   * @type {WechatUserInfo}
   */
  @Property({ type: 'json', nullable: true })
  userInfo?: WechatUserInfo;

  /**
   * 绑定的系统用户 ID。
   *
   * @type {string}
   */
  @Property({ type: 'uuid', nullable: true })
  userId?: string;

  /**
   * 状态。
   *
   * @type {'pending' | 'scanned' | 'success' | 'failed'}
   */
  @Property({
    type: 'varchar',
    default: 'pending',
    nullable: false,
  })
  status: 'pending' | 'scanned' | 'success' | 'failed' = 'pending';

  /**
   * 错误信息。
   *
   * @type {string}
   */
  @Property({ type: 'text', nullable: true })
  error?: string;

  /**
   * 生成的 JWT 令牌。
   *
   * @type {AuthTokensInterface}
   */
  @Property({ type: 'json', nullable: true })
  tokens?: AuthTokensInterface;

  /**
   * 过期时间（默认 5 分钟）。
   *
   * @type {Date}
   */
  @Property({ type: 'timestamp', nullable: false })
  expiresAt!: Date;

  /**
   * 关联的用户。
   *
   * @type {Rel<User>}
   */
  @ManyToOne(() => User, { nullable: true })
  user?: Rel<User>;
}
