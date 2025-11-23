import { describe, expect, it } from '@jest/globals';
import { Roles } from './roles.decorator.js';

describe('Roles', () => {
  it('应该返回装饰器函数', () => {
    // Roles() 装饰器返回 SetMetadata 的结果
    const result = Roles('ADMIN', 'USER');
    expect(typeof result).toBe('function');
    expect(result).toBeDefined();
  });

  it('应该支持单个角色', () => {
    const result = Roles('ADMIN');
    expect(typeof result).toBe('function');
  });

  it('应该支持多个角色', () => {
    const result = Roles('ADMIN', 'USER', 'SUPERADMIN');
    expect(typeof result).toBe('function');
  });

  it('应该能够被调用', () => {
    expect(() => Roles('ADMIN')).not.toThrow();
    expect(() => Roles('ADMIN', 'USER')).not.toThrow();
  });
});
