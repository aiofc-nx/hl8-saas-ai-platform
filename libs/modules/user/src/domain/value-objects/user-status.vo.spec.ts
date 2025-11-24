import { DomainException } from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
import { UserStatus, UserStatusEnum } from './user-status.vo.js';

describe('UserStatus', () => {
  describe('create', () => {
    it('应创建指定状态的值对象', () => {
      const status = UserStatus.create(UserStatusEnum.ACTIVE);

      expect(status.value).toBe(UserStatusEnum.ACTIVE);
    });
  });

  describe('静态工厂方法', () => {
    it('应创建活跃状态', () => {
      const status = UserStatus.active();

      expect(status.value).toBe(UserStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
    });

    it('应创建待激活状态', () => {
      const status = UserStatus.pendingActivation();

      expect(status.value).toBe(UserStatusEnum.PENDING_ACTIVATION);
      expect(status.isPendingActivation()).toBe(true);
    });

    it('应创建禁用状态', () => {
      const status = UserStatus.disabled();

      expect(status.value).toBe(UserStatusEnum.DISABLED);
      expect(status.isDisabled()).toBe(true);
    });

    it('应创建锁定状态', () => {
      const status = UserStatus.locked();

      expect(status.value).toBe(UserStatusEnum.LOCKED);
      expect(status.isLocked()).toBe(true);
    });

    it('应创建过期状态', () => {
      const status = UserStatus.expired();

      expect(status.value).toBe(UserStatusEnum.EXPIRED);
      expect(status.isExpired()).toBe(true);
    });
  });

  describe('状态判断方法', () => {
    it('应正确判断是否为活跃状态', () => {
      expect(UserStatus.active().isActive()).toBe(true);
      expect(UserStatus.pendingActivation().isActive()).toBe(false);
    });

    it('应正确判断是否为待激活状态', () => {
      expect(UserStatus.pendingActivation().isPendingActivation()).toBe(true);
      expect(UserStatus.active().isPendingActivation()).toBe(false);
    });

    it('应正确判断是否为禁用状态', () => {
      expect(UserStatus.disabled().isDisabled()).toBe(true);
      expect(UserStatus.active().isDisabled()).toBe(false);
    });

    it('应正确判断是否为锁定状态', () => {
      expect(UserStatus.locked().isLocked()).toBe(true);
      expect(UserStatus.active().isLocked()).toBe(false);
    });

    it('应正确判断是否为过期状态', () => {
      expect(UserStatus.expired().isExpired()).toBe(true);
      expect(UserStatus.active().isExpired()).toBe(false);
    });

    it('应正确判断是否可以登录', () => {
      expect(UserStatus.active().canLogin()).toBe(true);
      expect(UserStatus.pendingActivation().canLogin()).toBe(false);
      expect(UserStatus.disabled().canLogin()).toBe(false);
      expect(UserStatus.locked().canLogin()).toBe(false);
    });
  });

  describe('状态转换方法', () => {
    it('应从待激活状态转换为活跃状态', () => {
      const status = UserStatus.pendingActivation();
      const active = status.toActive();

      expect(active.isActive()).toBe(true);
    });

    it('应从禁用状态转换为活跃状态', () => {
      const status = UserStatus.disabled();
      const active = status.toActive();

      expect(active.isActive()).toBe(true);
    });

    it('应从锁定状态转换为活跃状态', () => {
      const status = UserStatus.locked();
      const active = status.toActive();

      expect(active.isActive()).toBe(true);
    });

    it('应在从活跃状态转换为活跃状态时抛出异常', () => {
      const status = UserStatus.active();

      expect(() => status.toActive()).toThrow(DomainException);
    });

    it('应从活跃状态转换为禁用状态', () => {
      const status = UserStatus.active();
      const disabled = status.toDisabled();

      expect(disabled.isDisabled()).toBe(true);
    });

    it('应从待激活状态转换为禁用状态', () => {
      const status = UserStatus.pendingActivation();
      const disabled = status.toDisabled();

      expect(disabled.isDisabled()).toBe(true);
    });

    it('应在从禁用状态转换为禁用状态时抛出异常', () => {
      const status = UserStatus.disabled();

      expect(() => status.toDisabled()).toThrow(DomainException);
    });

    it('应可以转换为锁定状态', () => {
      const status = UserStatus.active();
      const locked = status.toLocked();

      expect(locked.isLocked()).toBe(true);
    });

    it('应可以转换为过期状态', () => {
      const status = UserStatus.active();
      const expired = status.toExpired();

      expect(expired.isExpired()).toBe(true);
    });
  });
});
