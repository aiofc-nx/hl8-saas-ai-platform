import { describe, expect, it } from '@jest/globals';

import { AggregateId } from '../aggregates/aggregate-id.value-object.js';
import { DomainException } from '../exceptions/domain.exception.js';
import { EntityBase } from './entity.base.js';

class TestEntity extends EntityBase<AggregateId> {
  public constructor(id: AggregateId) {
    super(id);
  }
}

describe('EntityBase', () => {
  it('应通过构造函数创建实体', () => {
    const id = AggregateId.generate();
    const entity = new TestEntity(id);

    expect(entity.id).toEqual(id);
  });

  it('应拒绝空标识', () => {
    expect(() => new TestEntity(null as unknown as AggregateId)).toThrow(
      DomainException,
    );
    expect(() => new TestEntity(undefined as unknown as AggregateId)).toThrow(
      DomainException,
    );
  });

  it('equals 方法应在实体为 null 时返回 false', () => {
    const entity = new TestEntity(AggregateId.generate());

    expect(entity.equals(null as unknown as EntityBase<AggregateId>)).toBe(
      false,
    );
  });

  it('equals 方法应在实体为 undefined 时返回 false', () => {
    const entity = new TestEntity(AggregateId.generate());

    expect(entity.equals(undefined)).toBe(false);
  });

  it('equals 方法应在同一实例时返回 true', () => {
    const entity = new TestEntity(AggregateId.generate());

    expect(entity.equals(entity)).toBe(true);
  });

  it('equals 方法应在标识相同时返回 true', () => {
    const id = AggregateId.generate();
    const entity1 = new TestEntity(id);
    const entity2 = new TestEntity(id);

    expect(entity1.equals(entity2)).toBe(true);
  });

  it('equals 方法应在标识不同时返回 false', () => {
    const entity1 = new TestEntity(AggregateId.generate());
    const entity2 = new TestEntity(AggregateId.generate());

    expect(entity1.equals(entity2)).toBe(false);
  });
});
