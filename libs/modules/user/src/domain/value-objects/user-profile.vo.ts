import { DateTimeValueObject, ValueObjectBase } from '@hl8/domain-base';

interface UserProfileProps {
  readonly name: string;
  readonly gender: string;
  readonly phoneNumber: string | null;
  readonly profilePicture: string | null;
  readonly dateOfBirth: DateTimeValueObject | null;
  readonly address: string | null;
}

/**
 * @public
 * @description 用户资料值对象，封装用户的基本资料信息。
 * @example
 * ```ts
 * const profile = UserProfile.create({
 *   name: "张三",
 *   gender: "MALE",
 *   phoneNumber: "13800138000",
 * });
 * ```
 */
export class UserProfile extends ValueObjectBase<UserProfileProps> {
  private constructor(props: UserProfileProps) {
    super(props);
  }

  /**
   * @description 创建用户资料值对象。
   * @param props - 用户资料属性。
   * @returns 新的 `UserProfile` 实例。
   * @example
   * ```ts
   * const profile = UserProfile.create({
   *   name: "张三",
   *   gender: "MALE",
   * });
   * ```
   */
  public static create(props: {
    name: string;
    gender: string;
    phoneNumber?: string | null;
    profilePicture?: string | null;
    dateOfBirth?: Date | DateTimeValueObject | null;
    address?: string | null;
  }): UserProfile {
    const dateOfBirth =
      props.dateOfBirth instanceof Date
        ? DateTimeValueObject.fromJSDate(props.dateOfBirth)
        : (props.dateOfBirth ?? null);

    return new UserProfile({
      name: props.name.trim(),
      gender: props.gender.trim(),
      phoneNumber: props.phoneNumber?.trim() ?? null,
      profilePicture: props.profilePicture?.trim() ?? null,
      dateOfBirth,
      address: props.address?.trim() ?? null,
    });
  }

  /**
   * @description 更新用户资料，返回新的实例（保持不可变性）。
   * @param updates - 需要更新的属性。
   * @returns 新的 `UserProfile` 实例。
   * @example
   * ```ts
   * const updated = profile.update({ name: "李四" });
   * ```
   */
  public update(updates: {
    name?: string;
    gender?: string;
    phoneNumber?: string | null;
    profilePicture?: string | null;
    dateOfBirth?: Date | DateTimeValueObject | null;
    address?: string | null;
  }): UserProfile {
    const dateOfBirth =
      updates.dateOfBirth instanceof Date
        ? DateTimeValueObject.fromJSDate(updates.dateOfBirth)
        : updates.dateOfBirth !== undefined
          ? updates.dateOfBirth
          : this.dateOfBirth;

    return new UserProfile({
      name: updates.name?.trim() ?? this.name,
      gender: updates.gender?.trim() ?? this.gender,
      phoneNumber:
        updates.phoneNumber !== undefined
          ? (updates.phoneNumber?.trim() ?? null)
          : this.phoneNumber,
      profilePicture:
        updates.profilePicture !== undefined
          ? (updates.profilePicture?.trim() ?? null)
          : this.profilePicture,
      dateOfBirth,
      address:
        updates.address !== undefined
          ? (updates.address?.trim() ?? null)
          : this.address,
    });
  }

  /**
   * @description 获取用户姓名。
   * @returns 用户姓名字符串。
   */
  public get name(): string {
    return this.props.name;
  }

  /**
   * @description 获取用户性别。
   * @returns 用户性别字符串。
   */
  public get gender(): string {
    return this.props.gender;
  }

  /**
   * @description 获取用户手机号。
   * @returns 手机号字符串或 `null`。
   */
  public get phoneNumber(): string | null {
    return this.props.phoneNumber;
  }

  /**
   * @description 获取用户头像URL。
   * @returns 头像URL字符串或 `null`。
   */
  public get profilePicture(): string | null {
    return this.props.profilePicture;
  }

  /**
   * @description 获取用户出生日期。
   * @returns 出生日期值对象或 `null`。
   */
  public get dateOfBirth(): DateTimeValueObject | null {
    return this.props.dateOfBirth;
  }

  /**
   * @description 获取用户地址。
   * @returns 地址字符串或 `null`。
   */
  public get address(): string | null {
    return this.props.address;
  }
}
