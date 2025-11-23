import { describe, expect, it } from '@jest/globals';
import type { SecurityContext } from '../../interfaces/security-context.js';
import { CaslQueryBase } from './casl-query.base.js';

const securityContext: SecurityContext = {
  tenantId: 'tenant-1',
  userId: 'user-1',
};

class TestQuery extends CaslQueryBase<string> {
  public constructor(context: SecurityContext) {
    super(context);
  }

  public abilityDescriptor() {
    return { action: 'read', subject: 'TestQuery' };
  }

  public override auditPayload() {
    return { filter: { id: '123' } };
  }
}

describe('CaslQueryBase', () => {
  it('应该正确初始化安全上下文', () => {
    const query = new TestQuery(securityContext);

    expect(query.context).toEqual(securityContext);
    expect(query.context.tenantId).toBe('tenant-1');
    expect(query.context.userId).toBe('user-1');
  });

  it('应该返回权限描述', () => {
    const query = new TestQuery(securityContext);
    const descriptor = query.abilityDescriptor();

    expect(descriptor).toEqual({
      action: 'read',
      subject: 'TestQuery',
    });
  });

  it('默认 auditPayload 应该返回 undefined', () => {
    class QueryWithoutAuditPayload extends CaslQueryBase<string> {
      public constructor(context: SecurityContext) {
        super(context);
      }

      public abilityDescriptor() {
        return { action: 'read', subject: 'QueryWithoutAuditPayload' };
      }
    }

    const query = new QueryWithoutAuditPayload(securityContext);
    expect(query.auditPayload()).toBeUndefined();
  });

  it('应该支持重写 auditPayload', () => {
    const query = new TestQuery(securityContext);
    const payload = query.auditPayload();

    expect(payload).toEqual({ filter: { id: '123' } });
  });
});
