import { describe, expect, it } from '@jest/globals';

import { DomainException } from '../../exceptions/domain.exception.js';
import { UuidGenerator } from '../../utils/uuid-generator.js';
import { AggregateId } from './aggregate-id.vo.js';

describe('AggregateId', () => {
  describe('generate', () => {
    it('应生成新的聚合标识', () => {
      const id = AggregateId.generate();

      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('每次生成的标识应不同', () => {
      const id1 = AggregateId.generate();
      const id2 = AggregateId.generate();

      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('fromString', () => {
    it('应根据 UUID 字符串创建标识', () => {
      const uuid = UuidGenerator.generate();
      const id = AggregateId.fromString(uuid);

      expect(id.value).toBe(uuid);
    });

    it('应在值为无效 UUID 时抛出异常', () => {
      expect(() => AggregateId.fromString('invalid')).toThrow(DomainException);
      expect(() => AggregateId.fromString('')).toThrow(DomainException);
    });
  });

  describe('toString', () => {
    it('应返回 UUID 字符串', () => {
      const uuid = UuidGenerator.generate();
      const id = AggregateId.fromString(uuid);

      expect(id.toString()).toBe(uuid);
    });
  });

  describe('equals', () => {
    it('应在值相同时返回 true', () => {
      const uuid = UuidGenerator.generate();
      const id1 = AggregateId.fromString(uuid);
      const id2 = AggregateId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('应在值不同时返回 false', () => {
      const id1 = AggregateId.generate();
      const id2 = AggregateId.generate();

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
