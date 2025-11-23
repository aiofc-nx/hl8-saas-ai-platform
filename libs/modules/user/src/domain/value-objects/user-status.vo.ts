import {
  DomainException,
  ValueObjectBase,
  assertCondition,
} from '@hl8/domain-base';

interface UserStatusProps {
  readonly value: UserStatusEnum;
}

/**
 * @public
 * @description 用户状态枚举值。
 */
export enum UserStatusEnum {
  /** 活跃用户 */
  ACTIVE = 'ACTIVE',
  /** 待激活用户 */
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  /** 禁用用户 */
  DISABLED = 'DISABLED',
  /** 锁定用户 */
  LOCKED = 'LOCKED',
  /** 过期用户 */
  EXPIRED = 'EXPIRED',
}

/**
 * @public
 * @description 用户状态值对象，封装用户状态枚举及状态转换业务规则。
 * @example
 * ```ts
 * const status = UserStatus.create(UserStatusEnum.ACTIVE);
 * ```
 */
export class UserStatus extends ValueObjectBase<UserStatusProps> {
  private constructor(value: UserStatusEnum) {
    super({ value });
  }

  /**
   * @description 创建用户状态值对象。
   * @param value - 用户状态枚举值。
   * @returns 新的 `UserStatus` 实例。
   * @example
   * ```ts
   * const status = UserStatus.create(UserStatusEnum.ACTIVE);
   * ```
   */
  public static create(value: UserStatusEnum): UserStatus {
    return new UserStatus(value);
  }

  /**
   * @description 创建活跃状态。
   * @returns 活跃状态的 `UserStatus` 实例。
   */
  public static active(): UserStatus {
    return new UserStatus(UserStatusEnum.ACTIVE);
  }

  /**
   * @description 创建待激活状态。
   * @returns 待激活状态的 `UserStatus` 实例。
   */
  public static pendingActivation(): UserStatus {
    return new UserStatus(UserStatusEnum.PENDING_ACTIVATION);
  }

  /**
   * @description 创建禁用状态。
   * @returns 禁用状态的 `UserStatus` 实例。
   */
  public static disabled(): UserStatus {
    return new UserStatus(UserStatusEnum.DISABLED);
  }

  /**
   * @description 创建锁定状态。
   * @returns 锁定状态的 `UserStatus` 实例。
   */
  public static locked(): UserStatus {
    return new UserStatus(UserStatusEnum.LOCKED);
  }

  /**
   * @description 创建过期状态。
   * @returns 过期状态的 `UserStatus` 实例。
   */
  public static expired(): UserStatus {
    return new UserStatus(UserStatusEnum.EXPIRED);
  }

  /**
   * @description 判断是否为活跃状态。
   * @returns 若为活跃状态则返回 `true`，否则返回 `false`。
   */
  public isActive(): boolean {
    return this.value === UserStatusEnum.ACTIVE;
  }

  /**
   * @description 判断是否为待激活状态。
   * @returns 若为待激活状态则返回 `true`，否则返回 `false`。
   */
  public isPendingActivation(): boolean {
    return this.value === UserStatusEnum.PENDING_ACTIVATION;
  }

  /**
   * @description 判断是否为禁用状态。
   * @returns 若为禁用状态则返回 `true`，否则返回 `false`。
   */
  public isDisabled(): boolean {
    return this.value === UserStatusEnum.DISABLED;
  }

  /**
   * @description 判断是否为锁定状态。
   * @returns 若为锁定状态则返回 `true`，否则返回 `false`。
   */
  public isLocked(): boolean {
    return this.value === UserStatusEnum.LOCKED;
  }

  /**
   * @description 判断是否为过期状态。
   * @returns 若为过期状态则返回 `true`，否则返回 `false`。
   */
  public isExpired(): boolean {
    return this.value === UserStatusEnum.EXPIRED;
  }

  /**
   * @description 判断是否可以登录。
   * @returns 若可以登录则返回 `true`，否则返回 `false`。
   */
  public canLogin(): boolean {
    return this.isActive();
  }

  /**
   * @description 转换为活跃状态。
   * @returns 新的活跃状态实例。
   * @throws {DomainException} 当当前状态不允许转换为活跃状态时抛出。
   */
  public toActive(): UserStatus {
    assertCondition(
      this.isPendingActivation() || this.isDisabled() || this.isLocked(),
      '只有待激活、禁用或锁定状态可以转换为活跃状态',
    );
    return UserStatus.active();
  }

  /**
   * @description 转换为禁用状态。
   * @returns 新的禁用状态实例。
   * @throws {DomainException} 当当前状态不允许转换为禁用状态时抛出。
   */
  public toDisabled(): UserStatus {
    assertCondition(
      this.isActive() || this.isPendingActivation(),
      '只有活跃或待激活状态可以转换为禁用状态',
    );
    return UserStatus.disabled();
  }

  /**
   * @description 转换为锁定状态。
   * @returns 新的锁定状态实例。
   */
  public toLocked(): UserStatus {
    return UserStatus.locked();
  }

  /**
   * @description 转换为过期状态。
   * @returns 新的过期状态实例。
   */
  public toExpired(): UserStatus {
    return UserStatus.expired();
  }

  /**
   * @description 获取状态枚举值。
   * @returns 用户状态枚举值。
   */
  public get value(): UserStatusEnum {
    return this.props.value;
  }

  /**
   * @description 获取状态的字符串表示。
   * @returns 状态枚举值的字符串。
   */
  public toString(): string {
    return this.value;
  }
}
