import { describe, expect, it } from '@jest/globals';

import { DomainException } from '../exceptions/domain.exception.js';
import {
  assertCondition,
  assertDefined,
  assertNonEmptyString,
  assertUuid,
  assertValidDate,
} from './domain-guards.js';

describe('domain-guards', () => {
  describe('assertDefined', () => {
    it('应在值为 null 时抛出异常', () => {
      expect(() => assertDefined(null, '值不能为空')).toThrow(DomainException);
      expect(() => assertDefined(null, '值不能为空')).toThrow('值不能为空');
    });

    it('应在值为 undefined 时抛出异常', () => {
      expect(() => assertDefined(undefined, '值不能为空')).toThrow(
        DomainException,
      );
    });

    it('应在值已定义时不抛出异常', () => {
      expect(() => assertDefined('value', '值不能为空')).not.toThrow();
      expect(() => assertDefined(0, '值不能为空')).not.toThrow();
      expect(() => assertDefined(false, '值不能为空')).not.toThrow();
      expect(() => assertDefined('', '值不能为空')).not.toThrow();
    });

    it('应正确进行类型收窄', () => {
      const value: string | null = 'test';
      assertDefined(value, '值不能为空');
      // 此时 value 应该是 string 类型
      expect(typeof value).toBe('string');
    });
  });

  describe('assertNonEmptyString', () => {
    it('应在值为空字符串时抛出异常', () => {
      expect(() => assertNonEmptyString('', '字符串不能为空')).toThrow(
        DomainException,
      );
    });

    it('应在值为仅空白字符时抛出异常', () => {
      expect(() => assertNonEmptyString('   ', '字符串不能为空')).toThrow(
        DomainException,
      );
      expect(() => assertNonEmptyString('\t\n', '字符串不能为空')).toThrow(
        DomainException,
      );
    });

    it('应在值不是字符串时抛出异常', () => {
      expect(() =>
        assertNonEmptyString(123 as unknown as string, '字符串不能为空'),
      ).toThrow(DomainException);
      expect(() =>
        assertNonEmptyString(null as unknown as string, '字符串不能为空'),
      ).toThrow(DomainException);
    });

    it('应在值为非空字符串时不抛出异常', () => {
      expect(() =>
        assertNonEmptyString('test', '字符串不能为空'),
      ).not.toThrow();
      expect(() =>
        assertNonEmptyString('  test  ', '字符串不能为空'),
      ).not.toThrow();
    });
  });

  describe('assertUuid', () => {
    it('应在值为空字符串时抛出异常', () => {
      expect(() => assertUuid('', '必须是 UUID')).toThrow(DomainException);
    });

    it('应在值为无效 UUID 格式时抛出异常', () => {
      expect(() => assertUuid('not-a-uuid', '必须是 UUID')).toThrow(
        DomainException,
      );
      expect(() => assertUuid('123', '必须是 UUID')).toThrow(DomainException);
      expect(() => assertUuid('invalid-uuid-format', '必须是 UUID')).toThrow(
        DomainException,
      );
    });

    it('应在值为有效 UUID v4 时不抛出异常', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
      ];

      validUuids.forEach((uuid) => {
        expect(() => assertUuid(uuid, '必须是 UUID')).not.toThrow();
      });
    });

    it('应在值为无效版本 UUID 时抛出异常', () => {
      // UUID v1 格式但版本号不符合 v4 要求
      expect(() =>
        assertUuid('00000000-0000-0000-0000-000000000000', '必须是 UUID'),
      ).toThrow(DomainException);
    });
  });

  describe('assertValidDate', () => {
    it('应在值不是 Date 实例时抛出异常', () => {
      expect(() =>
        assertValidDate('2023-01-01' as unknown as Date, '必须是日期'),
      ).toThrow(DomainException);
      expect(() =>
        assertValidDate(123 as unknown as Date, '必须是日期'),
      ).toThrow(DomainException);
      expect(() =>
        assertValidDate(null as unknown as Date, '必须是日期'),
      ).toThrow(DomainException);
    });

    it('应在值为无效日期时抛出异常', () => {
      const invalidDate = new Date('invalid');
      expect(() => assertValidDate(invalidDate, '必须是日期')).toThrow(
        DomainException,
      );
    });

    it('应在值为有效日期时不抛出异常', () => {
      expect(() => assertValidDate(new Date(), '必须是日期')).not.toThrow();
      expect(() =>
        assertValidDate(new Date('2023-01-01'), '必须是日期'),
      ).not.toThrow();
      expect(() =>
        assertValidDate(new Date(1672531200000), '必须是日期'),
      ).not.toThrow();
    });
  });

  describe('assertCondition', () => {
    it('应在条件为 false 时抛出异常', () => {
      expect(() => assertCondition(false, '条件必须为真')).toThrow(
        DomainException,
      );
      expect(() => assertCondition(1 === 2, '条件必须为真')).toThrow(
        DomainException,
      );
    });

    it('应在条件为 true 时不抛出异常', () => {
      expect(() => assertCondition(true, '条件必须为真')).not.toThrow();
      expect(() => assertCondition(1 === 1, '条件必须为真')).not.toThrow();
    });
  });
});
