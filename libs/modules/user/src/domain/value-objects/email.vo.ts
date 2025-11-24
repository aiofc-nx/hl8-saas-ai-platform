import {
  DomainException,
  ValueObjectBase,
  assertNonEmptyString,
} from '@hl8/domain-base';

interface EmailProps {
  readonly value: string;
}

/**
 * @public
 * @description 邮箱地址值对象，封装邮箱格式验证。
 * @example
 * ```ts
 * const email = Email.create("user@example.com");
 * ```
 */
export class Email extends ValueObjectBase<EmailProps> {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  private constructor(value: string) {
    super({ value: value.toLowerCase().trim() });
  }

  /**
   * @description 创建邮箱值对象。
   * @param value - 邮箱地址字符串。
   * @returns 新的 `Email` 实例。
   * @throws {DomainException} 当邮箱格式不合法时抛出。
   * @example
   * ```ts
   * const email = Email.create("user@example.com");
   * ```
   */
  public static create(value: string): Email {
    assertNonEmptyString(value, '邮箱地址不能为空');
    const trimmed = value.trim().toLowerCase();

    if (!Email.EMAIL_REGEX.test(trimmed)) {
      throw new DomainException('邮箱格式不合法');
    }

    // 要求必须有顶级域名（至少包含一个点）
    const parts = trimmed.split('@');
    if (parts.length !== 2 || !parts[1].includes('.')) {
      throw new DomainException('邮箱格式不合法');
    }

    if (trimmed.length > 255) {
      throw new DomainException('邮箱地址长度不能超过255个字符');
    }

    return new Email(trimmed);
  }

  /**
   * @description 获取邮箱地址值。
   * @returns 邮箱地址字符串。
   */
  public get value(): string {
    return this.props.value;
  }

  /**
   * @description 获取邮箱的域名部分。
   * @returns 邮箱域名。
   */
  public get domain(): string {
    return this.value.split('@')[1] ?? '';
  }

  /**
   * @description 获取邮箱的用户名部分。
   * @returns 邮箱用户名。
   */
  public get localPart(): string {
    return this.value.split('@')[0] ?? '';
  }

  /**
   * @description 获取邮箱地址的字符串表示。
   * @returns 邮箱地址字符串。
   */
  public toString(): string {
    return this.value;
  }
}
