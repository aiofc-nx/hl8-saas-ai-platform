import { describe, expect, it } from '@jest/globals';

import { DomainException } from '../exceptions/domain.exception.js';
import { assertUuid } from './domain-guards.js';
import { UuidGenerator } from './uuid-generator.js';

describe('UuidGenerator', () => {
  describe('generate', () => {
    it('应生成有效的 UUID v4', () => {
      const uuid = UuidGenerator.generate();

      expect(typeof uuid).toBe('string');
      expect(() => assertUuid(uuid, '必须是 UUID')).not.toThrow();
    });

    it('每次生成的 UUID 应不同', () => {
      const uuid1 = UuidGenerator.generate();
      const uuid2 = UuidGenerator.generate();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('validate', () => {
    it('应在值为有效 UUID 时返回该值', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = UuidGenerator.validate(validUuid);

      expect(result).toBe(validUuid);
    });

    it('应在值为无效 UUID 时抛出异常', () => {
      expect(() => UuidGenerator.validate('')).toThrow(DomainException);
      expect(() => UuidGenerator.validate('not-a-uuid')).toThrow(
        DomainException,
      );
      expect(() => UuidGenerator.validate('123')).toThrow(DomainException);
    });

    it('应在值为空字符串时抛出异常', () => {
      expect(() => UuidGenerator.validate('')).toThrow(DomainException);
    });

    it('应在值为仅空白字符时抛出异常', () => {
      expect(() => UuidGenerator.validate('   ')).toThrow(DomainException);
    });
  });
});
