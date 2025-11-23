import {
  DomainException,
  ValueObjectBase,
  assertNonEmptyString,
} from '@hl8/domain-base';

interface UsernameProps {
  readonly value: string;
}

/**
 * @public
 * @description 用户名值对象，封装用户名格式验证。
 * @example
 * ```ts
 * const username = Username.create("john_doe");
 * ```
 */
export class Username extends ValueObjectBase<UsernameProps> {
  private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 30;

  private constructor(value: string) {
    super({ value: value.trim() });
  }

  /**
   * @description 创建用户名值对象。
   * @param value - 用户名字符串。
   * @returns 新的 `Username` 实例。
   * @throws {DomainException} 当用户名格式不合法时抛出。
   * @example
   * ```ts
   * const username = Username.create("john_doe");
   * ```
   */
  public static create(value: string): Username {
    assertNonEmptyString(value, '用户名不能为空');
    const trimmed = value.trim();

    if (trimmed.length < Username.MIN_LENGTH) {
      throw new DomainException(
        `用户名长度不能少于${Username.MIN_LENGTH}个字符`,
      );
    }

    if (trimmed.length > Username.MAX_LENGTH) {
      throw new DomainException(
        `用户名长度不能超过${Username.MAX_LENGTH}个字符`,
      );
    }

    if (!Username.USERNAME_REGEX.test(trimmed)) {
      throw new DomainException('用户名只能包含字母、数字、下划线和连字符');
    }

    return new Username(trimmed);
  }

  /**
   * @description 获取用户名值。
   * @returns 用户名字符串。
   */
  public get value(): string {
    return this.props.value;
  }

  /**
   * @description 获取用户名的字符串表示。
   * @returns 用户名字符串。
   */
  public toString(): string {
    return this.value;
  }
}
