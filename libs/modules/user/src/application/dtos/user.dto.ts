import { UserStatusEnum } from '../../domain/value-objects/user-status.vo.js';

/**
 * @public
 * @description 用户数据传输对象，用于应用层与接口层之间的数据传输。
 */
export interface UserDTO {
  /**
   * @description 用户唯一标识。
   */
  readonly id: string;

  /**
   * @description 租户标识。
   */
  readonly tenantId: string;

  /**
   * @description 用户邮箱。
   */
  readonly email: string;

  /**
   * @description 用户名。
   */
  readonly username: string;

  /**
   * @description 用户状态。
   */
  readonly status: UserStatusEnum;

  /**
   * @description 用户资料。
   */
  readonly profile: {
    readonly name: string;
    readonly gender: string;
    readonly phoneNumber: string | null;
    readonly profilePicture: string | null;
    readonly dateOfBirth: string | null;
    readonly address: string | null;
  };

  /**
   * @description 邮箱是否已验证。
   */
  readonly isEmailVerified: boolean;

  /**
   * @description 邮箱验证时间。
   */
  readonly emailVerifiedAt: string | null;

  /**
   * @description 最后登录时间。
   */
  readonly lastLoginAt: string | null;

  /**
   * @description 创建时间。
   */
  readonly createdAt: string;

  /**
   * @description 更新时间。
   */
  readonly updatedAt: string;
}
