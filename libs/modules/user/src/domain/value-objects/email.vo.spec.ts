import { DomainException } from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
import { Email } from './email.vo.js';

describe('Email', () => {
  describe('create', () => {
    it('应创建有效的邮箱值对象', () => {
      const email = Email.create('user@example.com');

      expect(email.value).toBe('user@example.com');
    });

    it('应自动转换为小写', () => {
      const email = Email.create('USER@EXAMPLE.COM');

      expect(email.value).toBe('user@example.com');
    });

    it('应自动去除首尾空格', () => {
      const email = Email.create('  user@example.com  ');

      expect(email.value).toBe('user@example.com');
    });

    it('应在邮箱为空时抛出异常', () => {
      expect(() => Email.create('')).toThrow(DomainException);
      expect(() => Email.create('   ')).toThrow(DomainException);
    });

    it('应在邮箱格式不合法时抛出异常', () => {
      expect(() => Email.create('invalid-email')).toThrow(DomainException);
      expect(() => Email.create('user@')).toThrow(DomainException);
      expect(() => Email.create('@example.com')).toThrow(DomainException);
      expect(() => Email.create('user@example')).toThrow(DomainException);
    });

    it('应在邮箱长度超过255个字符时抛出异常', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';

      expect(() => Email.create(longEmail)).toThrow(DomainException);
    });
  });

  describe('domain', () => {
    it('应返回邮箱的域名部分', () => {
      const email = Email.create('user@example.com');

      expect(email.domain).toBe('example.com');
    });
  });

  describe('localPart', () => {
    it('应返回邮箱的用户名部分', () => {
      const email = Email.create('user@example.com');

      expect(email.localPart).toBe('user');
    });
  });

  describe('toString', () => {
    it('应返回邮箱地址字符串', () => {
      const email = Email.create('user@example.com');

      expect(email.toString()).toBe('user@example.com');
    });
  });
});
