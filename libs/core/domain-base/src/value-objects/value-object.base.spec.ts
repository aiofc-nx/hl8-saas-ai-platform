import { describe, expect, it } from '@jest/globals';

import { ValueObjectBase } from './value-object.base.js';

interface TestProps {
  readonly value: string;
  readonly count: number;
}

class TestValueObject extends ValueObjectBase<TestProps> {
  public constructor(value: string, count: number) {
    super({ value, count });
  }

  public get value(): string {
    return this.props.value;
  }

  public get count(): number {
    return this.props.count;
  }
}

describe('ValueObjectBase', () => {
  it('应通过构造函数创建值对象', () => {
    const vo = new TestValueObject('test', 42);

    expect(vo.value).toBe('test');
    expect(vo.count).toBe(42);
  });

  it('equals 方法应在 other 为 undefined 时返回 false', () => {
    const vo = new TestValueObject('test', 42);

    expect(vo.equals(undefined)).toBe(false);
  });

  it('equals 方法应在 other 为 null 时返回 false', () => {
    const vo = new TestValueObject('test', 42);

    expect(vo.equals(null as unknown as ValueObjectBase<TestProps>)).toBe(
      false,
    );
  });

  it('equals 方法应在同一实例时返回 true', () => {
    const vo = new TestValueObject('test', 42);

    expect(vo.equals(vo)).toBe(true);
  });

  it('equals 方法应在属性相同时返回 true', () => {
    const vo1 = new TestValueObject('test', 42);
    const vo2 = new TestValueObject('test', 42);

    expect(vo1.equals(vo2)).toBe(true);
  });

  it('equals 方法应在属性不同时返回 false', () => {
    const vo1 = new TestValueObject('test', 42);
    const vo2 = new TestValueObject('other', 42);
    const vo3 = new TestValueObject('test', 100);

    expect(vo1.equals(vo2)).toBe(false);
    expect(vo1.equals(vo3)).toBe(false);
  });

  it('toJSON 方法应返回属性快照', () => {
    const vo = new TestValueObject('test', 42);
    const json = vo.toJSON();

    expect(json).toEqual({ value: 'test', count: 42 });
    expect(Object.isFrozen(json)).toBe(true);
  });

  it('属性应不可变', () => {
    const vo = new TestValueObject('test', 42);
    const props = vo.toJSON();

    expect(() => {
      (props as any).value = 'modified';
    }).toThrow();
  });
});
