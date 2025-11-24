import { DomainException } from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
import { Username } from './username.vo.js';

describe('Username', () => {
  describe('create', () => {
    it('应创建有效的用户名值对象', () => {
      const username = Username.create('john_doe');

      expect(username.value).toBe('john_doe');
    });

    it('应自动去除首尾空格', () => {
      const username = Username.create('  john_doe  ');

      expect(username.value).toBe('john_doe');
    });

    it('应在用户名为空时抛出异常', () => {
      expect(() => Username.create('')).toThrow(DomainException);
      expect(() => Username.create('   ')).toThrow(DomainException);
    });

    it('应在用户名长度少于3个字符时抛出异常', () => {
      expect(() => Username.create('ab')).toThrow(DomainException);
      expect(() => Username.create('a')).toThrow(DomainException);
    });

    it('应在用户名长度超过30个字符时抛出异常', () => {
      const longUsername = 'a'.repeat(31);

      expect(() => Username.create(longUsername)).toThrow(DomainException);
    });

    it('应在用户名包含非法字符时抛出异常', () => {
      expect(() => Username.create('john@doe')).toThrow(DomainException);
      expect(() => Username.create('john.doe')).toThrow(DomainException);
      expect(() => Username.create('john doe')).toThrow(DomainException);
      expect(() => Username.create('john!doe')).toThrow(DomainException);
    });

    it('应允许包含字母、数字、下划线和连字符', () => {
      expect(Username.create('john_doe').value).toBe('john_doe');
      expect(Username.create('john-doe').value).toBe('john-doe');
      expect(Username.create('john123').value).toBe('john123');
      expect(Username.create('John_Doe123').value).toBe('John_Doe123');
    });
  });

  describe('toString', () => {
    it('应返回用户名字符串', () => {
      const username = Username.create('john_doe');

      expect(username.toString()).toBe('john_doe');
    });
  });
});
