import {
  AggregateId,
  AggregateRootBase,
  AggregateRootProps,
  AuditTrail,
  DateTimeValueObject,
  TenantId,
  UserId,
  UuidGenerator,
} from '@hl8/domain-base';
import {
  UserActivatedEvent,
  UserCreatedEvent,
  UserDisabledEvent,
  UserLockedEvent,
  UserLoggedInEvent,
  UserPasswordChangedEvent,
  UserProfileUpdatedEvent,
  UserUnlockedEvent,
} from '../domain-events/index.js';
import {
  InvalidPasswordResetTokenException,
  UserDomainException,
  UserStatusException,
} from '../exceptions/user-domain.exception.js';
import {
  Email,
  PasswordHash,
  PasswordResetToken,
  UserProfile,
  UserStatus,
  Username,
} from '../value-objects/index.js';

/**
 * @public
 * @description 创建用户的参数接口。
 */
export interface CreateUserProps {
  tenantId: TenantId;
  email: Email;
  username: Username;
  passwordHash: PasswordHash;
  profile: UserProfile;
  createdBy?: string | null;
}

/**
 * @public
 * @description 用户聚合根，封装用户的所有业务逻辑和状态。
 * @example
 * ```ts
 * const user = User.create({
 *   tenantId,
 *   email: Email.create("user@example.com"),
 *   username: Username.create("john_doe"),
 *   passwordHash: PasswordHash.create("$2b$10$..."),
 *   profile: UserProfile.create({ name: "张三", gender: "MALE" }),
 * });
 * ```
 */
export class User extends AggregateRootBase<AggregateId> {
  private _email: Email;
  private _username: Username;
  private _passwordHash: PasswordHash;
  private _status: UserStatus;
  private _profile: UserProfile;
  private _isEmailVerified: boolean;
  private _emailVerifiedAt: DateTimeValueObject | null;
  private _passwordResetToken: PasswordResetToken | null;
  private _lastLoginAt: DateTimeValueObject | null;
  private _loginFailureCount: number;
  private _lockedUntil: DateTimeValueObject | null;

  private constructor(props: AggregateRootProps<AggregateId>) {
    super(props);
    // 这些属性将在 create 或 reconstitute 中初始化
    // 使用 ! 断言，因为这些属性会在 create 方法中立即被赋值
    this._email = null!;
    this._username = null!;
    this._passwordHash = null!;
    this._status = UserStatus.pendingActivation();
    this._profile = null!;
    this._isEmailVerified = false;
    this._emailVerifiedAt = null;
    this._passwordResetToken = null;
    this._lastLoginAt = null;
    this._loginFailureCount = 0;
    this._lockedUntil = null;
  }

  /**
   * @description 创建新用户。
   * @param props - 创建用户的参数。
   * @returns 新的 `User` 实例。
   * @example
   * ```ts
   * const user = User.create({
   *   tenantId,
   *   email: Email.create("user@example.com"),
   *   username: Username.create("john_doe"),
   *   passwordHash: PasswordHash.create("$2b$10$..."),
   *   profile: UserProfile.create({ name: "张三", gender: "MALE" }),
   * });
   * ```
   */
  public static create(props: CreateUserProps): User {
    const id = AggregateId.generate();
    const now = DateTimeValueObject.now();
    const createdBy = props.createdBy ? UserId.create(props.createdBy) : null;
    const auditTrail = AuditTrail.create({ createdBy, updatedBy: createdBy });

    const user = new User({
      id,
      tenantId: props.tenantId,
      auditTrail,
    });

    user._email = props.email;
    user._username = props.username;
    user._passwordHash = props.passwordHash;
    user._status = UserStatus.pendingActivation();
    user._profile = props.profile;
    user._isEmailVerified = false;
    user._emailVerifiedAt = null;
    user._passwordResetToken = null;
    user._lastLoginAt = null;
    user._loginFailureCount = 0;
    user._lockedUntil = null;

    user.ensureValidState();

    user.addDomainEvent(
      new UserCreatedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: now,
        aggregateId: id.toString(),
        tenantId: props.tenantId,
        triggeredBy: createdBy,
        auditMetadata: user.auditTrail,
        softDeleteStatus: user.softDeleteStatus,
        payload: {
          userId: id.toString(),
          email: props.email.value,
          username: props.username.value,
        },
      }),
    );

    return user;
  }

  /**
   * @description 激活用户。
   * @param actor - 执行操作的用户标识，可选。
   * @throws {UserStatusException} 当用户状态不允许激活时抛出。
   */
  public activate(actor?: string | null): void {
    if (!this._status.isPendingActivation()) {
      throw new UserStatusException('只有待激活状态的用户可以被激活');
    }

    const actorId = actor ? UserId.create(actor) : null;
    this._status = this._status.toActive();
    this.touch(actorId);
    this.addDomainEvent(
      new UserActivatedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: actorId,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
        },
      }),
    );
  }

  /**
   * @description 禁用用户。
   * @param actor - 执行操作的用户标识，可选。
   * @throws {UserStatusException} 当用户状态不允许禁用时抛出。
   */
  public disable(actor?: string | null): void {
    if (!this._status.isActive() && !this._status.isPendingActivation()) {
      throw new UserStatusException('只有活跃或待激活状态的用户可以被禁用');
    }

    const actorId = actor ? UserId.create(actor) : null;
    this._status = this._status.toDisabled();
    this.touch(actorId);

    this.addDomainEvent(
      new UserDisabledEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: actorId,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
        },
      }),
    );
  }

  /**
   * @description 锁定用户。
   * @param lockedUntil - 锁定到期时间，可选。
   * @param actor - 执行操作的用户标识，可选。
   */
  public lock(lockedUntil?: DateTimeValueObject, actor?: string | null): void {
    const actorId = actor ? UserId.create(actor) : null;
    this._status = this._status.toLocked();
    this._lockedUntil = lockedUntil ?? null;
    this.touch(actorId);

    this.addDomainEvent(
      new UserLockedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: actorId,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
          lockedUntil: lockedUntil?.toISOString() ?? null,
        },
      }),
    );
  }

  /**
   * @description 解锁用户。
   * @param actor - 执行操作的用户标识，可选。
   */
  public unlock(actor?: string | null): void {
    if (!this._status.isLocked()) {
      throw new UserStatusException('只有锁定状态的用户可以被解锁');
    }

    const actorId = actor ? UserId.create(actor) : null;
    this._status = UserStatus.active();
    this._lockedUntil = null;
    this._loginFailureCount = 0;
    this.touch(actorId);

    this.addDomainEvent(
      new UserUnlockedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: actorId,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
        },
      }),
    );
  }

  /**
   * @description 修改密码。
   * @param newPasswordHash - 新密码哈希。
   * @param actor - 执行操作的用户标识，可选。
   */
  public changePassword(
    newPasswordHash: PasswordHash,
    actor?: string | null,
  ): void {
    const actorId = actor ? UserId.create(actor) : null;
    this._passwordHash = newPasswordHash;
    this._passwordResetToken = null;
    this.touch(actorId);

    this.addDomainEvent(
      new UserPasswordChangedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: actorId,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
        },
      }),
    );
  }

  /**
   * @description 请求密码重置。
   * @param token - 密码重置令牌。
   * @param expiresAt - 令牌过期时间。
   */
  public requestPasswordReset(
    token: string,
    expiresAt: DateTimeValueObject,
  ): void {
    this._passwordResetToken = PasswordResetToken.create(token, expiresAt);
  }

  /**
   * @description 重置密码。
   * @param token - 密码重置令牌。
   * @param newPasswordHash - 新密码哈希。
   * @throws {InvalidPasswordResetTokenException} 当令牌无效或已过期时抛出。
   */
  public resetPassword(token: string, newPasswordHash: PasswordHash): void {
    if (!this._passwordResetToken) {
      throw new InvalidPasswordResetTokenException('密码重置令牌不存在');
    }

    if (this._passwordResetToken.token !== token) {
      throw new InvalidPasswordResetTokenException('密码重置令牌不匹配');
    }

    if (this._passwordResetToken.isExpired()) {
      throw new InvalidPasswordResetTokenException('密码重置令牌已过期');
    }

    this._passwordHash = newPasswordHash;
    this._passwordResetToken = null;

    this.addDomainEvent(
      new UserPasswordChangedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: null,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
        },
      }),
    );
  }

  /**
   * @description 更新用户资料。
   * @param updates - 需要更新的资料属性。
   * @param actor - 执行操作的用户标识，可选。
   */
  public updateProfile(
    updates: {
      name?: string;
      gender?: string;
      phoneNumber?: string | null;
      profilePicture?: string | null;
      dateOfBirth?: Date | DateTimeValueObject | null;
      address?: string | null;
    },
    actor?: string | null,
  ): void {
    const actorId = actor ? UserId.create(actor) : null;
    const oldProfile = this._profile;
    this._profile = this._profile.update(updates);
    this.touch(actorId);

    this.addDomainEvent(
      new UserProfileUpdatedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: actorId,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
          oldProfile: {
            name: oldProfile.name,
            gender: oldProfile.gender,
            phoneNumber: oldProfile.phoneNumber,
            profilePicture: oldProfile.profilePicture,
            dateOfBirth: oldProfile.dateOfBirth?.toISOString() ?? null,
            address: oldProfile.address,
          },
          newProfile: {
            name: this._profile.name,
            gender: this._profile.gender,
            phoneNumber: this._profile.phoneNumber,
            profilePicture: this._profile.profilePicture,
            dateOfBirth: this._profile.dateOfBirth?.toISOString() ?? null,
            address: this._profile.address,
          },
        },
      }),
    );
  }

  /**
   * @description 验证邮箱。
   */
  public verifyEmail(): void {
    if (this._isEmailVerified) {
      return;
    }

    this._isEmailVerified = true;
    this._emailVerifiedAt = DateTimeValueObject.now();
  }

  /**
   * @description 记录登录。
   */
  public recordLogin(): void {
    this._lastLoginAt = DateTimeValueObject.now();
    this._loginFailureCount = 0;

    // 如果用户被锁定但锁定时间已过，自动解锁
    if (this._status.isLocked() && this._lockedUntil) {
      const now = DateTimeValueObject.now();
      if (now.isAfter(this._lockedUntil)) {
        this.unlock();
        return;
      }
    }

    this.addDomainEvent(
      new UserLoggedInEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: null,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          userId: this.id.toString(),
          loginAt: this._lastLoginAt.toISOString(),
        },
      }),
    );
  }

  /**
   * @description 记录登录失败。
   * @param maxFailureCount - 最大失败次数，超过后将锁定用户，默认5次。
   * @param lockDurationMinutes - 锁定时长（分钟），默认30分钟。
   */
  public recordLoginFailure(
    maxFailureCount: number = 5,
    lockDurationMinutes: number = 30,
  ): void {
    this._loginFailureCount += 1;

    if (this._loginFailureCount >= maxFailureCount) {
      const lockUntil = DateTimeValueObject.now();
      const lockDate = new Date(lockUntil.toJSDate());
      lockDate.setMinutes(lockDate.getMinutes() + lockDurationMinutes);
      this.lock(DateTimeValueObject.fromJSDate(lockDate));
    }
  }

  /**
   * @description 实现聚合根不变式，确保用户状态合法。
   * @throws {DomainException} 当聚合状态不满足业务规则时抛出。
   */
  protected ensureValidState(): void {
    if (!this._email) {
      throw new UserDomainException('用户邮箱不能为空');
    }
    if (!this._username) {
      throw new UserDomainException('用户名不能为空');
    }
    if (!this._passwordHash) {
      throw new UserDomainException('密码哈希不能为空');
    }
    if (!this._status) {
      throw new UserDomainException('用户状态不能为空');
    }
    if (!this._profile) {
      throw new UserDomainException('用户资料不能为空');
    }
  }

  // Getters
  public get email(): Email {
    return this._email;
  }

  public get username(): Username {
    return this._username;
  }

  public get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  public get status(): UserStatus {
    return this._status;
  }

  public get profile(): UserProfile {
    return this._profile;
  }

  public get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  public get emailVerifiedAt(): DateTimeValueObject | null {
    return this._emailVerifiedAt;
  }

  public get passwordResetToken(): PasswordResetToken | null {
    return this._passwordResetToken;
  }

  public get lastLoginAt(): DateTimeValueObject | null {
    return this._lastLoginAt;
  }

  public get loginFailureCount(): number {
    return this._loginFailureCount;
  }

  public get lockedUntil(): DateTimeValueObject | null {
    return this._lockedUntil;
  }
}
