import { describe, expect, it } from '@jest/globals';

import { DomainException } from '../exceptions/domain.exception.js';
import { DateTimeValueObject } from './date-time.vo.js';

describe('DateTimeValueObject', () => {
  describe('now', () => {
    it('应创建当前时间的值对象', () => {
      const before = new Date();
      const dt = DateTimeValueObject.now();
      const after = new Date();

      expect(dt.toJSDate().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(dt.toJSDate().getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('fromJSDate', () => {
    it('应根据原生 Date 创建值对象', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const dt = DateTimeValueObject.fromJSDate(date);

      expect(dt.toJSDate().getTime()).toBe(date.getTime());
    });

    it('应创建新的 Date 实例（不可变）', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const dt = DateTimeValueObject.fromJSDate(date);
      date.setTime(0);

      expect(dt.toJSDate().getTime()).not.toBe(0);
    });

    it('应在日期无效时抛出异常', () => {
      const invalidDate = new Date('invalid');

      expect(() => DateTimeValueObject.fromJSDate(invalidDate)).toThrow(
        DomainException,
      );
    });
  });

  describe('fromISOString', () => {
    it('应根据 ISO 字符串创建值对象', () => {
      const isoString = '2023-01-01T00:00:00.000Z';
      const dt = DateTimeValueObject.fromISOString(isoString);

      expect(dt.toISOString()).toBe(isoString);
    });

    it('应处理各种 ISO 格式', () => {
      const testCases = [
        '2023-01-01T00:00:00Z',
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T12:30:45.123Z',
      ];

      testCases.forEach((isoString) => {
        const dt = DateTimeValueObject.fromISOString(isoString);
        expect(dt.toISOString()).toContain('2023-01-01');
      });
    });

    it('应在字符串无效时抛出异常', () => {
      expect(() => DateTimeValueObject.fromISOString('invalid')).toThrow(
        DomainException,
      );
      expect(() => DateTimeValueObject.fromISOString('not-a-date')).toThrow(
        DomainException,
      );
    });
  });

  describe('toJSDate', () => {
    it('应返回新的 Date 实例', () => {
      const dt = DateTimeValueObject.now();
      const date1 = dt.toJSDate();
      const date2 = dt.toJSDate();

      expect(date1).not.toBe(date2);
      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('toISOString', () => {
    it('应返回 ISO 格式字符串', () => {
      const dt = DateTimeValueObject.fromISOString('2023-01-01T00:00:00.000Z');

      expect(dt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('isAfter', () => {
    it('应在当前时间晚于其他时间时返回 true', () => {
      const earlier = DateTimeValueObject.fromISOString(
        '2023-01-01T00:00:00.000Z',
      );
      const later = DateTimeValueObject.fromISOString(
        '2023-01-02T00:00:00.000Z',
      );

      expect(later.isAfter(earlier)).toBe(true);
    });

    it('应在当前时间早于其他时间时返回 false', () => {
      const earlier = DateTimeValueObject.fromISOString(
        '2023-01-01T00:00:00.000Z',
      );
      const later = DateTimeValueObject.fromISOString(
        '2023-01-02T00:00:00.000Z',
      );

      expect(earlier.isAfter(later)).toBe(false);
    });

    it('应在时间相同时返回 false', () => {
      const dt1 = DateTimeValueObject.fromISOString('2023-01-01T00:00:00.000Z');
      const dt2 = DateTimeValueObject.fromISOString('2023-01-01T00:00:00.000Z');

      expect(dt1.isAfter(dt2)).toBe(false);
    });
  });
});
