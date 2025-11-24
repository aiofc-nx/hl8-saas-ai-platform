import {
  AggregateId,
  DateTimeValueObject,
  TenantId,
  UserId,
} from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
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
  UserStatusException,
} from '../exceptions/user-domain.exception.js';
import {
  Email,
  PasswordHash,
  UserProfile,
  Username,
} from '../value-objects/index.js';
import { User } from './user.aggregate.js';

describe('User', () => {
  const tenantId = TenantId.create('tenant-1');
  const email = Email.create('user@example.com');
  const username = Username.create('john_doe');
  const passwordHash = PasswordHash.create('$2b$10$hash');
  const profile = UserProfile.create({
    name: '张三',
    gender: 'MALE',
  });

  describe('create', () => {
    it('应创建新用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      expect(user.id).toBeInstanceOf(AggregateId);
      expect(user.tenantId).toBe(tenantId);
      expect(user.email).toBe(email);
      expect(user.username).toBe(username);
      expect(user.passwordHash).toBe(passwordHash);
      expect(user.profile).toBe(profile);
      expect(user.status.isPendingActivation()).toBe(true);
      expect(user.isEmailVerified).toBe(false);
      expect(user.emailVerifiedAt).toBeNull();
      expect(user.passwordResetToken).toBeNull();
      expect(user.lastLoginAt).toBeNull();
      expect(user.loginFailureCount).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });

    it('应发布 UserCreatedEvent', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      const events = user.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      const createdEvent = events[0] as UserCreatedEvent;
      expect(createdEvent.payload.userId).toBe(user.id.toString());
      expect(createdEvent.payload.email).toBe(email.value);
      expect(createdEvent.payload.username).toBe(username.value);
    });

    it('应记录创建者', () => {
      const createdBy = UserId.create('creator-1');
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
        createdBy: createdBy.toString(),
      });

      expect(user.auditTrail.createdBy?.toString()).toBe(createdBy.toString());
    });
  });

  describe('activate', () => {
    it('应激活待激活状态的用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      // 清除 User.create 发布的事件
      user.pullDomainEvents();

      user.activate();

      expect(user.status.isActive()).toBe(true);
      const events = user.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserActivatedEvent);
    });

    it('应在用户不是待激活状态时抛出异常', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();

      expect(() => user.activate()).toThrow(UserStatusException);
    });
  });

  describe('disable', () => {
    it('应禁用活跃状态的用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();

      user.disable();

      expect(user.status.isDisabled()).toBe(true);
      const events = user.pullDomainEvents();
      expect(events.some((e) => e instanceof UserDisabledEvent)).toBe(true);
    });

    it('应禁用待激活状态的用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      user.disable();

      expect(user.status.isDisabled()).toBe(true);
    });

    it('应在用户状态不允许禁用时抛出异常', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();
      user.disable();

      expect(() => user.disable()).toThrow(UserStatusException);
    });
  });

  describe('lock', () => {
    it('应锁定用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();

      const lockedUntil = DateTimeValueObject.fromISOString(
        '2024-12-31T23:59:59.000Z',
      );
      user.lock(lockedUntil);

      expect(user.status.isLocked()).toBe(true);
      expect(user.lockedUntil).toBe(lockedUntil);
      const events = user.pullDomainEvents();
      expect(events.some((e) => e instanceof UserLockedEvent)).toBe(true);
    });

    it('应在不指定锁定时间时锁定用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();

      user.lock();

      expect(user.status.isLocked()).toBe(true);
      expect(user.lockedUntil).toBeNull();
    });
  });

  describe('unlock', () => {
    it('应解锁锁定状态的用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();
      user.lock();

      user.unlock();

      expect(user.status.isActive()).toBe(true);
      expect(user.lockedUntil).toBeNull();
      expect(user.loginFailureCount).toBe(0);
      const events = user.pullDomainEvents();
      expect(events.some((e) => e instanceof UserUnlockedEvent)).toBe(true);
    });

    it('应在用户不是锁定状态时抛出异常', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      expect(() => user.unlock()).toThrow(UserStatusException);
    });
  });

  describe('changePassword', () => {
    it('应修改密码', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      const newPasswordHash = PasswordHash.create('$2b$10$newhash');
      user.changePassword(newPasswordHash);

      expect(user.passwordHash).toBe(newPasswordHash);
      expect(user.passwordResetToken).toBeNull();
      const events = user.pullDomainEvents();
      expect(events.some((e) => e instanceof UserPasswordChangedEvent)).toBe(
        true,
      );
    });
  });

  describe('updateProfile', () => {
    it('应更新用户资料', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      const oldProfile = user.profile;
      user.updateProfile({ name: '李四' });

      expect(user.profile.name).toBe('李四');
      expect(user.profile.gender).toBe(oldProfile.gender);
      const events = user.pullDomainEvents();
      expect(events.some((e) => e instanceof UserProfileUpdatedEvent)).toBe(
        true,
      );
    });
  });

  describe('recordLogin', () => {
    it('应记录登录并重置失败次数', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();
      // 模拟登录失败
      user.recordLoginFailure();

      user.recordLogin();

      expect(user.lastLoginAt).toBeInstanceOf(DateTimeValueObject);
      expect(user.loginFailureCount).toBe(0);
      const events = user.pullDomainEvents();
      expect(events.some((e) => e instanceof UserLoggedInEvent)).toBe(true);
    });

    it('应在锁定时间已过时自动解锁', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();
      const pastDate = DateTimeValueObject.fromISOString(
        '2020-01-01T00:00:00Z',
      );
      user.lock(pastDate);

      user.recordLogin();

      expect(user.status.isActive()).toBe(true);
      expect(user.lockedUntil).toBeNull();
    });
  });

  describe('recordLoginFailure', () => {
    it('应在失败次数达到阈值时锁定用户', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.activate();

      for (let i = 0; i < 5; i++) {
        user.recordLoginFailure();
      }

      expect(user.status.isLocked()).toBe(true);
      expect(user.lockedUntil).toBeInstanceOf(DateTimeValueObject);
    });
  });

  describe('resetPassword', () => {
    it('应使用有效令牌重置密码', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      const token = 'reset-token-123';
      // 使用未来的时间，确保令牌未过期
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const expiresAt = DateTimeValueObject.fromJSDate(futureDate);
      user.requestPasswordReset(token, expiresAt);

      const newPasswordHash = PasswordHash.create('$2b$10$newhash');
      user.resetPassword(token, newPasswordHash);

      expect(user.passwordHash).toBe(newPasswordHash);
      expect(user.passwordResetToken).toBeNull();
      const events = user.pullDomainEvents();
      expect(events.some((e) => e instanceof UserPasswordChangedEvent)).toBe(
        true,
      );
    });

    it('应在令牌不存在时抛出异常', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      const newPasswordHash = PasswordHash.create('$2b$10$newhash');

      expect(() => user.resetPassword('token', newPasswordHash)).toThrow(
        InvalidPasswordResetTokenException,
      );
    });

    it('应在令牌不匹配时抛出异常', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      const token = 'reset-token-123';
      // 使用未来的时间，确保令牌未过期
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const expiresAt = DateTimeValueObject.fromJSDate(futureDate);
      user.requestPasswordReset(token, expiresAt);

      const newPasswordHash = PasswordHash.create('$2b$10$newhash');

      expect(() => user.resetPassword('wrong-token', newPasswordHash)).toThrow(
        InvalidPasswordResetTokenException,
      );
    });

    it('应在令牌已过期时抛出异常', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      const token = 'reset-token-123';
      const pastDate = DateTimeValueObject.fromISOString(
        '2020-01-01T00:00:00Z',
      );
      user.requestPasswordReset(token, pastDate);

      const newPasswordHash = PasswordHash.create('$2b$10$newhash');

      expect(() => user.resetPassword(token, newPasswordHash)).toThrow(
        InvalidPasswordResetTokenException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('应验证邮箱', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });

      expect(user.isEmailVerified).toBe(false);

      user.verifyEmail();

      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerifiedAt).toBeInstanceOf(DateTimeValueObject);
    });

    it('应在邮箱已验证时不重复验证', () => {
      const user = User.create({
        tenantId,
        email,
        username,
        passwordHash,
        profile,
      });
      user.verifyEmail();
      const verifiedAt = user.emailVerifiedAt;

      user.verifyEmail();

      expect(user.emailVerifiedAt).toBe(verifiedAt);
    });
  });
});
