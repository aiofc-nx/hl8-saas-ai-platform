import { DateTimeValueObject, TenantId } from '@hl8/domain-base';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { UserLoggedInEvent } from '../../../../domain/domain-events/user-logged-in.event.js';
import { UserLoggedInHandler } from './user-logged-in.handler.js';

describe('UserLoggedInHandler', () => {
  let handler: UserLoggedInHandler;

  beforeEach(() => {
    handler = new UserLoggedInHandler();
  });

  it('应处理用户登录事件', async () => {
    const event = new UserLoggedInEvent({
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      occurredAt: DateTimeValueObject.now(),
      aggregateId: '550e8400-e29b-41d4-a716-446655440001',
      tenantId: TenantId.create('550e8400-e29b-41d4-a716-446655440002'),
      triggeredBy: null,
      auditMetadata: {} as any,
      softDeleteStatus: {} as any,
      payload: {
        userId: 'user-1',
        loginAt: new Date().toISOString(),
      },
    });

    // 当前实现为占位，只验证不抛出异常
    await expect(handler.handle(event)).resolves.toBeUndefined();
  });
});
