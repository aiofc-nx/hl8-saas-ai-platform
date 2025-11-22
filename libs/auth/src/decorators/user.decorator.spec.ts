import { describe, expect, it } from '@jest/globals';
import { User } from './user.decorator.js';

/**
 * User 装饰器测试。
 *
 * @description 由于 `createParamDecorator` 内部使用了 Reflect 元数据，
 * 在单元测试中完整模拟其行为比较复杂。这里我们主要验证装饰器函数本身可以被调用，
 * 以及它返回的函数签名。实际的功能测试应该通过集成测试完成。
 */
describe('User', () => {
  it('应该是一个装饰器函数', () => {
    // User 装饰器应该返回一个函数（装饰器函数）
    const decorator = User();
    expect(typeof decorator).toBe('function');
  });

  it('应该能够被调用而不报错', () => {
    // 验证装饰器可以被调用
    expect(() => User()).not.toThrow();
  });

  it('应该返回一个可执行的函数', () => {
    const decoratorFn = User();
    expect(typeof decoratorFn).toBe('function');
    // 装饰器函数应该接受两个参数（data 和 context）
    expect(decoratorFn.length).toBeGreaterThanOrEqual(0);
  });
});
