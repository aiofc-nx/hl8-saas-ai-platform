/**
 * @public
 * @description 创建用户请求数据传输对象。
 */
export interface CreateUserDTO {
  /**
   * @description 用户邮箱。
   */
  readonly email: string;

  /**
   * @description 用户名。
   */
  readonly username: string;

  /**
   * @description 密码哈希值。
   */
  readonly passwordHash: string;

  /**
   * @description 用户资料。
   */
  readonly profile: {
    readonly name: string;
    readonly gender: string;
    readonly phoneNumber?: string | null;
    readonly profilePicture?: string | null;
    readonly dateOfBirth?: string | null;
    readonly address?: string | null;
  };
}
