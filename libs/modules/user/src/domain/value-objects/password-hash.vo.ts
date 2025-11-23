import { assertNonEmptyString, ValueObjectBase } from '@hl8/domain-base';

interface PasswordHashProps {
  readonly value: string;
}

/**
 * @public
 * @description 密码哈希值对象，封装密码哈希值，不包含明文密码。
 * @example
 * ```ts
 * const passwordHash = PasswordHash.create("$2b$10$...");
 * ```
 */
export class PasswordHash extends ValueObjectBase<PasswordHashProps> {
  private constructor(value: string) {
    super({ value });
  }

  /**
   * @description 创建密码哈希值对象。
   * @param value - 密码哈希字符串。
   * @returns 新的 `PasswordHash` 实例。
   * @throws {DomainException} 当密码哈希为空时抛出。
   * @example
   * ```ts
   * const passwordHash = PasswordHash.create("$2b$10$...");
   * ```
   */
  public static create(value: string): PasswordHash {
    assertNonEmptyString(value, '密码哈希不能为空');
    return new PasswordHash(value);
  }

  /**
   * @description 获取密码哈希值。
   * @returns 密码哈希字符串。
   */
  public get value(): string {
    return this.props.value;
  }

  /**
   * @description 获取密码哈希的字符串表示。
   * @returns 密码哈希字符串。
   */
  public toString(): string {
    return this.value;
  }
}
