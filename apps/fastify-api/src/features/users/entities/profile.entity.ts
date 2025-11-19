import { Base } from '@/common/entities';
import type { Rel } from '@mikro-orm/postgresql';
import { Entity, OneToOne, Property } from '@mikro-orm/postgresql';
import { User } from './user.entity';

/**
 * 用户性别枚举。
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 用户个人资料实体。
 *
 * @description 表示用户的详细个人信息，包括：
 * - 基本信息（姓名、性别）
 * - 联系方式（电话、地址）
 * - 个人资料（头像、生日）
 *
 * @property {Rel<User>} user - 关联的用户
 * @property {string} name - 用户姓名
 * @property {Gender} gender - 用户性别
 * @property {string} [phoneNumber] - 电话号码
 * @property {string} [profilePicture] - 头像 URL 或路径
 * @property {Date} [dateOfBirth] - 出生日期
 * @property {string} [address] - 地址
 */
@Entity()
export class Profile extends Base {
  /**
   * 关联的用户。
   *
   * @type {Rel<User>}
   */
  @OneToOne(() => User, (user) => user.profile, {
    owner: true,
  })
  user!: Rel<User>;

  /**
   * 用户姓名。
   *
   * @type {string}
   */
  @Property({ type: 'varchar', nullable: false })
  name!: string;

  /**
   * 用户性别。
   *
   * @type {Gender}
   */
  @Property({
    type: 'varchar',
    default: Gender.UNKNOWN,
  })
  gender: Gender = Gender.UNKNOWN;

  /**
   * 电话号码。
   *
   * @type {string | undefined}
   */
  @Property({ type: 'varchar', unique: true, nullable: true })
  phoneNumber?: string;

  /**
   * 头像 URL 或路径。
   *
   * @type {string | undefined}
   */
  @Property({ type: 'varchar', nullable: true })
  profilePicture?: string;

  /**
   * 出生日期。
   *
   * @type {Date | undefined}
   */
  @Property({ type: 'timestamp', nullable: true })
  dateOfBirth?: Date;

  /**
   * 地址。
   *
   * @type {string | undefined}
   */
  @Property({ type: 'text', nullable: true })
  address?: string;
}
