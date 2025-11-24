import { DomainException } from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
import { PasswordHash } from './password-hash.vo.js';

describe('PasswordHash', () => {
  describe('create', () => {
    it('应创建有效的密码哈希值对象', () => {
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz123456';
      const passwordHash = PasswordHash.create(hash);

      expect(passwordHash.value).toBe(hash);
    });

    it('应在密码哈希为空时抛出异常', () => {
      expect(() => PasswordHash.create('')).toThrow(DomainException);
      expect(() => PasswordHash.create('   ')).toThrow(DomainException);
    });

    it('应接受任何非空字符串作为密码哈希', () => {
      const hash1 = '$2b$10$abcdefghijklmnopqrstuvwxyz123456';
      const hash2 = 'sha256$abcdef123456';
      const hash3 = 'plain_hash_value';

      expect(PasswordHash.create(hash1).value).toBe(hash1);
      expect(PasswordHash.create(hash2).value).toBe(hash2);
      expect(PasswordHash.create(hash3).value).toBe(hash3);
    });
  });

  describe('toString', () => {
    it('应返回密码哈希字符串', () => {
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz123456';
      const passwordHash = PasswordHash.create(hash);

      expect(passwordHash.toString()).toBe(hash);
    });
  });
});
