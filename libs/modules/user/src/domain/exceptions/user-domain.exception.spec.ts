import { describe, expect, it } from '@jest/globals';
import {
  InvalidPasswordException,
  InvalidPasswordResetTokenException,
  UserAlreadyExistsException,
  UserDomainException,
  UserNotFoundException,
  UserStatusException,
} from './user-domain.exception.js';

describe('UserDomainException', () => {
  it('应创建用户领域异常', () => {
    const exception = new UserDomainException('测试异常');

    expect(exception).toBeInstanceOf(Error);
    expect(exception.name).toBe('UserDomainException');
    expect(exception.message).toBe('测试异常');
  });
});

describe('UserNotFoundException', () => {
  it('应创建用户不存在异常', () => {
    const exception = new UserNotFoundException();

    expect(exception).toBeInstanceOf(UserDomainException);
    expect(exception.name).toBe('UserNotFoundException');
    expect(exception.message).toBe('用户不存在');
  });

  it('应支持自定义消息', () => {
    const exception = new UserNotFoundException('用户ID不存在');

    expect(exception.message).toBe('用户ID不存在');
  });
});

describe('UserAlreadyExistsException', () => {
  it('应创建用户已存在异常', () => {
    const exception = new UserAlreadyExistsException();

    expect(exception).toBeInstanceOf(UserDomainException);
    expect(exception.name).toBe('UserAlreadyExistsException');
    expect(exception.message).toBe('用户已存在');
  });

  it('应支持自定义消息', () => {
    const exception = new UserAlreadyExistsException('邮箱已被使用');

    expect(exception.message).toBe('邮箱已被使用');
  });
});

describe('UserStatusException', () => {
  it('应创建用户状态异常', () => {
    const exception = new UserStatusException('用户状态不允许操作');

    expect(exception).toBeInstanceOf(UserDomainException);
    expect(exception.name).toBe('UserStatusException');
    expect(exception.message).toBe('用户状态不允许操作');
  });
});

describe('InvalidPasswordException', () => {
  it('应创建密码错误异常', () => {
    const exception = new InvalidPasswordException();

    expect(exception).toBeInstanceOf(UserDomainException);
    expect(exception.name).toBe('InvalidPasswordException');
    expect(exception.message).toBe('密码错误');
  });

  it('应支持自定义消息', () => {
    const exception = new InvalidPasswordException('密码不匹配');

    expect(exception.message).toBe('密码不匹配');
  });
});

describe('InvalidPasswordResetTokenException', () => {
  it('应创建密码重置令牌无效异常', () => {
    const exception = new InvalidPasswordResetTokenException();

    expect(exception).toBeInstanceOf(UserDomainException);
    expect(exception.name).toBe('InvalidPasswordResetTokenException');
    expect(exception.message).toBe('密码重置令牌无效或已过期');
  });

  it('应支持自定义消息', () => {
    const exception = new InvalidPasswordResetTokenException('令牌已过期');

    expect(exception.message).toBe('令牌已过期');
  });
});
