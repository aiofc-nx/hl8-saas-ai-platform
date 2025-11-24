import { DateTimeValueObject, DomainException } from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
import { PasswordResetToken } from './password-reset-token.vo.js';

describe('PasswordResetToken', () => {
  describe('create', () => {
    it('应创建有效的密码重置令牌值对象', () => {
      const token = 'token123';
      const expiresAt = DateTimeValueObject.now();
      const resetToken = PasswordResetToken.create(token, expiresAt);

      expect(resetToken.token).toBe(token);
      expect(resetToken.expiresAt).toBe(expiresAt);
    });

    it('应在令牌为空时抛出异常', () => {
      const expiresAt = DateTimeValueObject.now();

      expect(() => PasswordResetToken.create('', expiresAt)).toThrow(
        DomainException,
      );
      expect(() => PasswordResetToken.create('   ', expiresAt)).toThrow(
        DomainException,
      );
    });
  });

  describe('isExpired', () => {
    it('应在令牌未过期时返回 false', () => {
      const token = 'token123';
      const expiresAt = DateTimeValueObject.fromISOString(
        '2024-12-31T23:59:59.000Z',
      );
      const resetToken = PasswordResetToken.create(token, expiresAt);
      const now = DateTimeValueObject.fromISOString('2024-01-01T00:00:00.000Z');

      expect(resetToken.isExpired(now)).toBe(false);
    });

    it('应在令牌已过期时返回 true', () => {
      const token = 'token123';
      const expiresAt = DateTimeValueObject.fromISOString(
        '2024-01-01T00:00:00.000Z',
      );
      const resetToken = PasswordResetToken.create(token, expiresAt);
      const now = DateTimeValueObject.fromISOString('2024-12-31T23:59:59.000Z');

      expect(resetToken.isExpired(now)).toBe(true);
    });

    it('应在令牌刚好过期时返回 true', () => {
      const token = 'token123';
      const expiresAt = DateTimeValueObject.fromISOString(
        '2024-01-01T00:00:00.000Z',
      );
      const resetToken = PasswordResetToken.create(token, expiresAt);

      expect(resetToken.isExpired(expiresAt)).toBe(true);
    });
  });

  describe('isValid', () => {
    it('应在令牌有效时返回 true', () => {
      const token = 'token123';
      const expiresAt = DateTimeValueObject.fromISOString(
        '2024-12-31T23:59:59.000Z',
      );
      const resetToken = PasswordResetToken.create(token, expiresAt);
      const now = DateTimeValueObject.fromISOString('2024-01-01T00:00:00.000Z');

      expect(resetToken.isValid(now)).toBe(true);
    });

    it('应在令牌无效时返回 false', () => {
      const token = 'token123';
      const expiresAt = DateTimeValueObject.fromISOString(
        '2024-01-01T00:00:00.000Z',
      );
      const resetToken = PasswordResetToken.create(token, expiresAt);
      const now = DateTimeValueObject.fromISOString('2024-12-31T23:59:59.000Z');

      expect(resetToken.isValid(now)).toBe(false);
    });
  });
});
