import { Base } from '@/common/entities';
import { Entity, ManyToOne, Property, Rel } from '@mikro-orm/postgresql';
import { User } from '@/features/users/entities/user.entity';

/**
 * 用户会话实体。
 *
 * @description 表示用户的登录会话，包含：
 * - 设备信息（IP、位置、设备类型、浏览器等）
 * - 刷新令牌
 * - 关联的用户
 *
 * @property {string} ip - 会话 IP 地址
 * @property {string} location - 地理位置
 * @property {string} device_os - 设备操作系统
 * @property {string} device_name - 设备名称
 * @property {string} device_type - 设备类型
 * @property {string} browser - 浏览器
 * @property {string} userAgent - 用户代理字符串
 * @property {string} refresh_token - 刷新令牌
 * @property {Rel<User>} user - 关联的用户
 */
@Entity()
export class Session extends Base {
  /**
   * 会话 IP 地址。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, default: 'unknown' })
  ip: string = 'unknown';

  /**
   * 地理位置。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, default: 'unknown' })
  location: string = 'unknown';

  /**
   * 设备操作系统。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, default: 'unknown' })
  device_os: string = 'unknown';

  /**
   * 设备名称。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, default: 'unknown' })
  device_name: string = 'unknown';

  /**
   * 设备类型。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, default: 'unknown' })
  device_type: string = 'unknown';

  /**
   * 浏览器。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, default: 'unknown' })
  browser: string = 'unknown';

  /**
   * 用户代理字符串。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: true, default: 'unknown' })
  userAgent: string = 'unknown';

  /**
   * 刷新令牌。
   *
   * @type {string}
   */
  @Property({ type: 'text' })
  refresh_token!: string;

  /**
   * 关联的用户。
   *
   * @type {Rel<User>}
   */
  @ManyToOne(() => User)
  user!: Rel<User>;
}
