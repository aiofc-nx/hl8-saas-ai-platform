import { DateTimeValueObject, TenantId } from '@hl8/domain-base';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { UserProfileUpdatedEvent } from '../../../../domain/domain-events/user-profile-updated.event.js';
import { UserProfileUpdatedHandler } from './user-profile-updated.handler.js';

describe('UserProfileUpdatedHandler', () => {
  let handler: UserProfileUpdatedHandler;

  beforeEach(() => {
    handler = new UserProfileUpdatedHandler();
  });

  it('应处理用户资料更新事件', async () => {
    const event = new UserProfileUpdatedEvent({
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      occurredAt: DateTimeValueObject.now(),
      aggregateId: '550e8400-e29b-41d4-a716-446655440001',
      tenantId: TenantId.create('550e8400-e29b-41d4-a716-446655440002'),
      triggeredBy: null,
      auditMetadata: {} as any,
      softDeleteStatus: {} as any,
      payload: {
        userId: 'user-1',
        oldProfile: {
          name: '张三',
          gender: 'MALE',
          phoneNumber: null,
          profilePicture: null,
          dateOfBirth: null,
          address: null,
        },
        newProfile: {
          name: '李四',
          gender: 'MALE',
          phoneNumber: null,
          profilePicture: null,
          dateOfBirth: null,
          address: null,
        },
      },
    });

    // 当前实现为占位，只验证不抛出异常
    await expect(handler.handle(event)).resolves.toBeUndefined();
  });
});
