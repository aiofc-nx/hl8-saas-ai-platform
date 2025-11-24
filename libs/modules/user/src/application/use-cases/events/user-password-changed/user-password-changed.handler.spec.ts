import { DateTimeValueObject, TenantId } from '@hl8/domain-base';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { UserPasswordChangedEvent } from '../../../../domain/domain-events/user-password-changed.event.js';
import { UserPasswordChangedHandler } from './user-password-changed.handler.js';

describe('UserPasswordChangedHandler', () => {
  let handler: UserPasswordChangedHandler;

  beforeEach(() => {
    handler = new UserPasswordChangedHandler();
  });

  it('应处理用户密码变更事件', async () => {
    const event = new UserPasswordChangedEvent({
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      occurredAt: DateTimeValueObject.now(),
      aggregateId: '550e8400-e29b-41d4-a716-446655440001',
      tenantId: TenantId.create('550e8400-e29b-41d4-a716-446655440002'),
      triggeredBy: null,
      auditMetadata: {} as any,
      softDeleteStatus: {} as any,
      payload: {
        userId: 'user-1',
      },
    });

    // 当前实现为占位，只验证不抛出异常
    await expect(handler.handle(event)).resolves.toBeUndefined();
  });
});
