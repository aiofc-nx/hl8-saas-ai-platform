import { describe, expect, it } from '@jest/globals';

import { DateTimeValueObject } from '../value-objects/date-time.vo.js';
import { UserId } from '../value-objects/user-id.vo.js';
import { SoftDeleteStatus } from './soft-delete-status.value-object.js';

describe('SoftDeleteStatus', () => {
  describe('create', () => {
    it('应创建未删除状态', () => {
      const status = SoftDeleteStatus.create();

      expect(status.isDeleted).toBe(false);
      expect(status.deletedAt).toBeNull();
      expect(status.deletedBy).toBeNull();
    });

    it('应接受初始状态参数', () => {
      const deletedAt = DateTimeValueObject.now();
      const deletedBy = UserId.create('user_1');
      const status = SoftDeleteStatus.create({
        isDeleted: true,
        deletedAt,
        deletedBy,
      });

      expect(status.isDeleted).toBe(true);
      expect(status.deletedAt).toEqual(deletedAt);
      expect(status.deletedBy).toEqual(deletedBy);
    });
  });

  describe('markDeleted', () => {
    it('应将状态标记为已删除', () => {
      const status = SoftDeleteStatus.create();
      const actor = UserId.create('deleter');
      const deleted = status.markDeleted(actor);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedAt).not.toBeNull();
      expect(deleted.deletedBy).toEqual(actor);
    });

    it('应在已删除时返回自身', () => {
      const deletedAt = DateTimeValueObject.now();
      const deletedBy = UserId.create('deleter');
      const status = SoftDeleteStatus.create({
        isDeleted: true,
        deletedAt,
        deletedBy,
      });

      const result = status.markDeleted(UserId.create('another'));

      expect(result).toBe(status);
      expect(result.deletedAt).toEqual(deletedAt);
      expect(result.deletedBy).toEqual(deletedBy);
    });

    it('应支持 null actor', () => {
      const status = SoftDeleteStatus.create();
      const deleted = status.markDeleted(null);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedBy).toBeNull();
    });
  });

  describe('restore', () => {
    it('应恢复已删除状态', () => {
      const deletedAt = DateTimeValueObject.now();
      const deletedBy = UserId.create('deleter');
      const status = SoftDeleteStatus.create({
        isDeleted: true,
        deletedAt,
        deletedBy,
      });

      const restored = status.restore(null);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      // restore 方法会使用传入的 actor，如果传入 null 则为 null
      expect(restored.deletedBy).toBeNull();
    });

    it('应使用传入的 actor 作为 deletedBy', () => {
      const deletedAt = DateTimeValueObject.now();
      const deletedBy = UserId.create('deleter');
      const status = SoftDeleteStatus.create({
        isDeleted: true,
        deletedAt,
        deletedBy,
      });

      const restorer = UserId.create('restorer');
      const restored = status.restore(restorer);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedBy).toEqual(restorer);
    });

    it('应在未删除时返回自身', () => {
      const status = SoftDeleteStatus.create();
      const result = status.restore(UserId.create('actor'));

      expect(result).toBe(status);
      expect(result.isDeleted).toBe(false);
    });

    it('应支持 null actor', () => {
      const deletedAt = DateTimeValueObject.now();
      const status = SoftDeleteStatus.create({
        isDeleted: true,
        deletedAt,
        deletedBy: UserId.create('deleter'),
      });

      const restored = status.restore(null);

      expect(restored.isDeleted).toBe(false);
    });
  });
});
