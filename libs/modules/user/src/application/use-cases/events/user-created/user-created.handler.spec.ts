import { describe, expect, it } from '@jest/globals';
import { UserCreatedEvent } from '../../../../domain/domain-events/user-created.event.js';
import { UserCreatedHandler } from './user-created.handler.js';

describe('UserCreatedHandler', () => {
  let handler: UserCreatedHandler;

  beforeEach(() => {
    handler = new UserCreatedHandler();
  });

  it('应处理用户创建事件', async () => {
    const event = new UserCreatedEvent({
      eventId: 'event-1',
      occurredAt: new Date(),
      aggregateId: 'user-1',
      tenantId: 'tenant-1',
      triggeredBy: null,
      auditMetadata: {} as any,
      softDeleteStatus: {} as any,
      payload: {
        userId: 'user-1',
        email: 'user@example.com',
        username: 'john_doe',
      },
    });

    // 当前实现为占位，只验证不抛出异常
    await expect(handler.handle(event)).resolves.toBeUndefined();
  });
});
