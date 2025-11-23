import { DomainException } from '@hl8/domain-base';

/**
 * @public
 * @description 用户领域异常基类，用于表示用户领域相关的业务异常。
 * @example
 * ```ts
 * throw new UserDomainException("用户不存在");
 * ```
 */
export class UserDomainException extends DomainException {
  public constructor(message: string) {
    super(message);
    this.name = 'UserDomainException';
  }
}

/**
 * @public
 * @description 用户不存在异常。
 */
export class UserNotFoundException extends UserDomainException {
  public constructor(message: string = '用户不存在') {
    super(message);
    this.name = 'UserNotFoundException';
  }
}

/**
 * @public
 * @description 用户已存在异常。
 */
export class UserAlreadyExistsException extends UserDomainException {
  public constructor(message: string = '用户已存在') {
    super(message);
    this.name = 'UserAlreadyExistsException';
  }
}

/**
 * @public
 * @description 用户状态不允许操作异常。
 */
export class UserStatusException extends UserDomainException {
  public constructor(message: string) {
    super(message);
    this.name = 'UserStatusException';
  }
}

/**
 * @public
 * @description 密码错误异常。
 */
export class InvalidPasswordException extends UserDomainException {
  public constructor(message: string = '密码错误') {
    super(message);
    this.name = 'InvalidPasswordException';
  }
}

/**
 * @public
 * @description 密码重置令牌无效或已过期异常。
 */
export class InvalidPasswordResetTokenException extends UserDomainException {
  public constructor(message: string = '密码重置令牌无效或已过期') {
    super(message);
    this.name = 'InvalidPasswordResetTokenException';
  }
}
