import {
  DateTimeValueObject,
  DomainException,
  ValueObjectBase,
  assertNonEmptyString,
} from '@hl8/domain-base';

interface PasswordResetTokenProps {
  readonly token: string;
  readonly expiresAt: DateTimeValueObject;
}

/**
 * @public
 * @description 密码重置令牌值对象，封装密码重置令牌和过期时间。
 * @example
 * ```ts
 * const resetToken = PasswordResetToken.create("token123", DateTimeValueObject.now());
 * ```
 */
export class PasswordResetToken extends ValueObjectBase<PasswordResetTokenProps> {
  private constructor(token: string, expiresAt: DateTimeValueObject) {
    super({ token, expiresAt });
  }

  /**
   * @description 创建密码重置令牌值对象。
   * @param token - 重置令牌字符串。
   * @param expiresAt - 过期时间。
   * @returns 新的 `PasswordResetToken` 实例。
   * @throws {DomainException} 当令牌为空时抛出。
   * @example
   * ```ts
   * const resetToken = PasswordResetToken.create("token123", DateTimeValueObject.now());
   * ```
   */
  public static create(
    token: string,
    expiresAt: DateTimeValueObject,
  ): PasswordResetToken {
    assertNonEmptyString(token, '密码重置令牌不能为空');
    return new PasswordResetToken(token, expiresAt);
  }

  /**
   * @description 判断令牌是否已过期。
   * @param now - 当前时间，可选，默认为当前时间。
   * @returns 若已过期则返回 `true`，否则返回 `false`。
   */
  public isExpired(now?: DateTimeValueObject): boolean {
    const currentTime = now ?? DateTimeValueObject.now();
    return (
      currentTime.isAfter(this.expiresAt) ||
      currentTime.toJSDate().getTime() >= this.expiresAt.toJSDate().getTime()
    );
  }

  /**
   * @description 判断令牌是否有效（未过期）。
   * @param now - 当前时间，可选，默认为当前时间。
   * @returns 若有效则返回 `true`，否则返回 `false`。
   */
  public isValid(now?: DateTimeValueObject): boolean {
    return !this.isExpired(now);
  }

  /**
   * @description 获取令牌值。
   * @returns 令牌字符串。
   */
  public get token(): string {
    return this.props.token;
  }

  /**
   * @description 获取过期时间。
   * @returns 过期时间值对象。
   */
  public get expiresAt(): DateTimeValueObject {
    return this.props.expiresAt;
  }
}
