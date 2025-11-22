import { Base } from '@/common/entities';
import { Session } from '@/features/auth/entities/session.entity';
import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  OneToOne,
  Property,
} from '@mikro-orm/postgresql';
import { Profile } from './profile.entity';

/**
 * 用户账户实体。
 *
 * @description 表示系统中的用户账户，包含：
 * - 用户基本信息（邮箱、用户名、密码）
 * - 邮箱验证状态
 * - 关联的个人资料
 * - 关联的会话列表
 *
 * @property {string} email - 用户邮箱地址
 * @property {string} password - 用户加密后的密码
 * @property {string} username - 用户名
 * @property {boolean} isEmailVerified - 邮箱是否已验证
 * @property {Date} emailVerifiedAt - 邮箱验证时间
 * @property {Collection<Session>} sessions - 用户会话集合
 * @property {Profile} profile - 用户个人资料
 */
@Entity()
export class User extends Base {
  /**
   * 用户邮箱地址。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', unique: true, nullable: false })
  email!: string;

  /**
   * 用户加密后的密码。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, hidden: true })
  password?: string;

  /**
   * 用户名。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', unique: true, nullable: false })
  username!: string;

  /**
   * 邮箱是否已验证。
   *
   * @type {boolean}
   */
  @Property({ type: 'boolean', nullable: true, default: false })
  isEmailVerified: boolean = false;

  /**
   * 邮箱验证时间。
   *
   * @type {Date}
   */
  @Property({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  /**
   * 微信 openid（如果用户通过微信登录）。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, unique: true })
  wechatOpenid?: string;

  /**
   * 用户会话集合。
   *
   * @type {Collection<Session>}
   */
  @OneToMany(() => Session, (session) => session.user, {
    cascade: [Cascade.PERSIST, Cascade.REMOVE],
  })
  sessions = new Collection<Session>(this);

  /**
   * 用户个人资料。
   *
   * @type {Profile}
   */
  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: [Cascade.PERSIST, Cascade.REMOVE],
  })
  profile!: Profile;
}
