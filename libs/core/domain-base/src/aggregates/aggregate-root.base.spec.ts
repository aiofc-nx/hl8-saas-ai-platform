import { jest } from '@jest/globals';

import type { AggregateRootProps } from '../../src/aggregates/aggregate-root.base.js';
import { AggregateRootBase } from '../../src/aggregates/aggregate-root.base.js';
import { AuditTrail } from '../../src/auditing/audit-trail.value-object.js';
import { SoftDeleteStatus } from '../../src/auditing/soft-delete-status.value-object.js';
import { DomainEventBase } from '../../src/events/domain-event.base.js';
import { DomainException } from '../../src/exceptions/domain.exception.js';
import { UuidGenerator } from '../../src/utils/uuid-generator.js';
import {
  AggregateId,
  DepartmentId,
  OrganizationId,
  TenantId,
  UserId,
} from '../../src/value-objects/ids/index.js';
import { DateTimeValueObject } from '../value-objects/date-time.vo.js';

interface TestAggregateProps extends AggregateRootProps<AggregateId> {
  readonly name: string;
}

class TestDomainEvent extends DomainEventBase {
  constructor(props: {
    aggregate: AggregateId;
    tenant: TenantId;
    actor?: UserId | null;
  }) {
    super({
      eventId: UuidGenerator.generate(),
      occurredAt: DateTimeValueObject.now(),
      aggregateId: props.aggregate.value,
      tenantId: props.tenant,
      triggeredBy: props.actor ?? null,
      auditMetadata: AuditTrail.create({ createdBy: props.actor ?? null }),
      softDeleteStatus: SoftDeleteStatus.create(),
    });
  }

  eventName(): string {
    return 'TestDomainEvent';
  }
}

class TestAggregate extends AggregateRootBase<AggregateId> {
  private _name: string;

  protected constructor(props: TestAggregateProps) {
    super(props);
    this._name = props.name;
    this.ensureValidState();
  }

  static create(
    name: string,
    overrides: Partial<TestAggregateProps> = {},
  ): TestAggregate {
    const tenantId = overrides.tenantId ?? TenantId.create('tenant_test');
    const auditTrail =
      overrides.auditTrail ?? AuditTrail.create({ createdBy: null });
    const softDeleteStatus =
      overrides.softDeleteStatus ?? SoftDeleteStatus.create();

    // 使用 'organizationId' in overrides 来区分未提供和显式传入 undefined
    const organizationId =
      'organizationId' in overrides
        ? overrides.organizationId
        : OrganizationId.create('org_test');
    const departmentId =
      'departmentId' in overrides
        ? overrides.departmentId
        : DepartmentId.create('dept_test');

    return new TestAggregate({
      id: overrides.id ?? AggregateId.generate(),
      tenantId,
      organizationId,
      departmentId,
      auditTrail,
      softDeleteStatus,
      version: overrides.version ?? 0,
      name,
    });
  }

  protected ensureValidState(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new DomainException('聚合名称不能为空');
    }
  }

  changeName(name: string, actor: UserId | null = null): void {
    this._name = name;
    this.touch(actor);
    this.ensureValidState();
  }

  remove(actor: UserId | null = null): void {
    this.markDeleted(actor);
  }

  restoreAggregate(actor: UserId | null = null): void {
    this.restore(actor);
  }

  enforceTenantContext(tenantId: TenantId): void {
    this.assertSameTenant(tenantId);
  }

  enforceOrganizationContext(organizationId?: OrganizationId): void {
    this.assertSameOrganization(organizationId);
  }

  enforceDepartmentContext(departmentId?: DepartmentId): void {
    this.assertSameDepartment(departmentId);
  }

  publishDomainEvent(event: DomainEventBase): void {
    this.addDomainEvent(event);
  }

  get name(): string {
    return this._name;
  }
}

describe('AggregateRootBase', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enforce invariants through ensureValidState', () => {
    expect(() => TestAggregate.create('')).toThrow(DomainException);
  });

  it('should update audit trail when touch is invoked', () => {
    const aggregate = TestAggregate.create('initial');
    const actor = UserId.create('user_actor');

    const initialUpdatedAt = aggregate.auditTrail.updatedAt;
    jest.useFakeTimers({ now: Date.now() + 1_000 });

    aggregate.changeName('updated', actor);

    expect(aggregate.auditTrail.updatedBy).toEqual(actor);
    expect(aggregate.auditTrail.updatedAt.isAfter(initialUpdatedAt)).toBe(true);
  });

  it('should mark aggregate as deleted and restore it', () => {
    const actor = UserId.create('deleter');
    const aggregate = TestAggregate.create('test');

    aggregate.remove(actor);

    expect(aggregate.softDeleteStatus.isDeleted).toBe(true);
    expect(aggregate.softDeleteStatus.deletedBy).toEqual(actor);
    expect(aggregate.softDeleteStatus.deletedAt).not.toBeNull();

    aggregate.restoreAggregate(actor);

    expect(aggregate.softDeleteStatus.isDeleted).toBe(false);
    expect(aggregate.softDeleteStatus.deletedAt).toBeNull();
  });

  it('should guard against cross-tenant operations', () => {
    const aggregate = TestAggregate.create('test');
    const otherTenant = TenantId.create('tenant_other');

    expect(() => aggregate.enforceTenantContext(otherTenant)).toThrow(
      DomainException,
    );
  });

  it('should collect domain events and clear queue after polling', () => {
    const aggregate = TestAggregate.create('test');
    const event = new TestDomainEvent({
      aggregate: aggregate.id,
      tenant: aggregate.tenantId,
      actor: null,
    });

    aggregate.publishDomainEvent(event);

    const events = aggregate.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBe(event);
    expect(aggregate.pullDomainEvents()).toHaveLength(0);
  });

  it('should return empty array when no domain events', () => {
    const aggregate = TestAggregate.create('test');

    expect(aggregate.pullDomainEvents()).toHaveLength(0);
  });

  it('should collect multiple domain events', () => {
    const aggregate = TestAggregate.create('test');
    const event1 = new TestDomainEvent({
      aggregate: aggregate.id,
      tenant: aggregate.tenantId,
    });
    const event2 = new TestDomainEvent({
      aggregate: aggregate.id,
      tenant: aggregate.tenantId,
    });

    aggregate.publishDomainEvent(event1);
    aggregate.publishDomainEvent(event2);

    const events = aggregate.pullDomainEvents();

    expect(events).toHaveLength(2);
    expect(events[0]).toBe(event1);
    expect(events[1]).toBe(event2);
  });

  it('should guard against cross-organization operations', () => {
    const orgId = OrganizationId.create('org_1');
    const aggregate = TestAggregate.create('test', {
      organizationId: orgId,
    });
    const otherOrg = OrganizationId.create('org_2');

    expect(() => aggregate.enforceOrganizationContext(otherOrg)).toThrow(
      DomainException,
    );
  });

  it('should allow operations when organization is not set', () => {
    // 创建一个没有 organizationId 的聚合
    // 使用 create 方法，显式传入 undefined 来覆盖默认值
    const aggregate = TestAggregate.create('test', {
      organizationId: undefined,
    });

    // 当聚合没有 organizationId 时，传入 undefined 不应该抛出异常
    // 注意：代码逻辑是如果聚合没有 organizationId，直接返回，不校验
    expect(() => aggregate.enforceOrganizationContext(undefined)).not.toThrow();
  });

  it('should allow operations when organization matches', () => {
    const orgId = OrganizationId.create('org_1');
    const aggregate = TestAggregate.create('test', {
      organizationId: orgId,
    });

    expect(() => aggregate.enforceOrganizationContext(orgId)).not.toThrow();
  });

  it('should guard against cross-department operations', () => {
    const deptId = DepartmentId.create('dept_1');
    const aggregate = TestAggregate.create('test', {
      departmentId: deptId,
    });
    const otherDept = DepartmentId.create('dept_2');

    expect(() => aggregate.enforceDepartmentContext(otherDept)).toThrow(
      DomainException,
    );
  });

  it('should allow operations when department is not set', () => {
    // 创建一个没有 departmentId 的聚合
    // 使用 create 方法，显式传入 undefined 来覆盖默认值
    const aggregate = TestAggregate.create('test', {
      departmentId: undefined,
    });

    // 当聚合没有 departmentId 时，传入 undefined 不应该抛出异常
    expect(() => aggregate.enforceDepartmentContext(undefined)).not.toThrow();
  });

  it('should allow operations when department matches', () => {
    const deptId = DepartmentId.create('dept_1');
    const aggregate = TestAggregate.create('test', {
      departmentId: deptId,
    });

    expect(() => aggregate.enforceDepartmentContext(deptId)).not.toThrow();
  });

  it('should use custom error message for tenant assertion', () => {
    class TestAggregateWithCustomMessage extends TestAggregate {
      public assertTenantWithMessage(
        tenantId: TenantId,
        message: string,
      ): void {
        this.assertSameTenant(tenantId, message);
      }

      static createForTest(): TestAggregateWithCustomMessage {
        return new TestAggregateWithCustomMessage({
          id: AggregateId.generate(),
          tenantId: TenantId.create('tenant_test'),
          name: 'test',
        });
      }
    }
    const aggregate = TestAggregateWithCustomMessage.createForTest();
    const otherTenant = TenantId.create('tenant_other');

    expect(() =>
      aggregate.assertTenantWithMessage(otherTenant, '自定义租户错误'),
    ).toThrow('自定义租户错误');
  });

  it('should use custom error message for organization assertion', () => {
    class TestAggregateWithCustomMessage extends TestAggregate {
      public assertOrgWithMessage(
        organizationId: OrganizationId,
        message: string,
      ): void {
        this.assertSameOrganization(organizationId, message);
      }

      static createForTest(
        organizationId: OrganizationId,
      ): TestAggregateWithCustomMessage {
        return new TestAggregateWithCustomMessage({
          id: AggregateId.generate(),
          tenantId: TenantId.create('tenant_test'),
          organizationId,
          name: 'test',
        });
      }
    }
    const orgId = OrganizationId.create('org_1');
    const aggregate = TestAggregateWithCustomMessage.createForTest(orgId);
    const otherOrg = OrganizationId.create('org_2');

    expect(() =>
      aggregate.assertOrgWithMessage(otherOrg, '自定义组织错误'),
    ).toThrow('自定义组织错误');
  });

  it('should use custom error message for department assertion', () => {
    class TestAggregateWithCustomMessage extends TestAggregate {
      public assertDeptWithMessage(
        departmentId: DepartmentId,
        message: string,
      ): void {
        this.assertSameDepartment(departmentId, message);
      }

      static createForTest(
        departmentId: DepartmentId,
      ): TestAggregateWithCustomMessage {
        return new TestAggregateWithCustomMessage({
          id: AggregateId.generate(),
          tenantId: TenantId.create('tenant_test'),
          departmentId,
          name: 'test',
        });
      }
    }
    const deptId = DepartmentId.create('dept_1');
    const aggregate = TestAggregateWithCustomMessage.createForTest(deptId);
    const otherDept = DepartmentId.create('dept_2');

    expect(() =>
      aggregate.assertDeptWithMessage(otherDept, '自定义部门错误'),
    ).toThrow('自定义部门错误');
  });

  it('should initialize with default version 0', () => {
    const aggregate = TestAggregate.create('test');

    expect(aggregate.version).toBe(0);
  });

  it('should accept custom version', () => {
    const aggregate = TestAggregate.create('test', {
      version: 5,
    });

    expect(aggregate.version).toBe(5);
  });

  it('should access tenant, organization, and department IDs', () => {
    const tenantId = TenantId.create('tenant_1');
    const orgId = OrganizationId.create('org_1');
    const deptId = DepartmentId.create('dept_1');
    const aggregate = TestAggregate.create('test', {
      tenantId,
      organizationId: orgId,
      departmentId: deptId,
    });

    expect(aggregate.tenantId).toEqual(tenantId);
    expect(aggregate.organizationId).toEqual(orgId);
    expect(aggregate.departmentId).toEqual(deptId);
  });
});
