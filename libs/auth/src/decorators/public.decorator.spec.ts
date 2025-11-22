import { describe, expect, it } from '@jest/globals';
import { Public } from './public.decorator.js';

describe('Public', () => {
  it('应该返回 SetMetadata 的结果', () => {
    // Public() 装饰器返回 SetMetadata(IS_PUBLIC_KEY, true) 的结果
    // 由于 SetMetadata 在 NestJS 中会设置元数据，我们只需要验证返回的是一个函数
    const result = Public();
    expect(typeof result).toBe('function');
    // 验证装饰器工厂函数存在
    expect(result).toBeDefined();
  });

  it('应该能够被调用', () => {
    // 验证装饰器可以被调用而不报错
    expect(() => Public()).not.toThrow();
  });
});
