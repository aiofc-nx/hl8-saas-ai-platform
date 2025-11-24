/**
 * @public
 * @description 更新用户资料请求数据传输对象。
 */
export interface UpdateProfileDTO {
  /**
   * @description 用户姓名。
   */
  readonly name?: string;

  /**
   * @description 用户性别。
   */
  readonly gender?: string;

  /**
   * @description 手机号。
   */
  readonly phoneNumber?: string | null;

  /**
   * @description 头像URL。
   */
  readonly profilePicture?: string | null;

  /**
   * @description 出生日期（ISO 8601 格式）。
   */
  readonly dateOfBirth?: string | null;

  /**
   * @description 地址。
   */
  readonly address?: string | null;
}
