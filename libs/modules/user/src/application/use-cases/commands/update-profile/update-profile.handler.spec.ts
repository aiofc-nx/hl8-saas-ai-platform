import type { ExecutionContext } from '@hl8/application-base';
import {
  AggregateId,
  RepositoryFindByCriteria,
  TenantId,
} from '@hl8/domain-base';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { EventBus } from '@nestjs/cqrs';
import { User } from '../../../../domain/aggregates/user.aggregate.js';
import { UserNotFoundException } from '../../../../domain/exceptions/user-domain.exception.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import {
  Email,
  PasswordHash,
  UserProfile,
  Username,
} from '../../../../domain/value-objects/index.js';
import { UpdateProfileCommand } from './update-profile.command.js';
import { UpdateProfileHandler } from './update-profile.handler.js';

class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  public async findById(id: AggregateId): Promise<User | null> {
    return this.users.get(id.toString()) ?? null;
  }

  public async findByEmail(): Promise<User | null> {
    return null;
  }

  public async findByUsername(): Promise<User | null> {
    return null;
  }

  public async existsByEmail(): Promise<boolean> {
    return false;
  }

  public async existsByUsername(): Promise<boolean> {
    return false;
  }

  public async save(user: User): Promise<void> {
    this.users.set(user.id.toString(), user);
  }

  public async delete(id: AggregateId): Promise<void> {
    this.users.delete(id.toString());
  }

  public async findBy(
    criteria: RepositoryFindByCriteria<AggregateId>,
  ): Promise<User[]> {
    const results: User[] = [];
    for (const user of this.users.values()) {
      if (user.tenantId.equals(criteria.tenantId)) {
        if (criteria.ids && !criteria.ids.some((id) => id.equals(user.id))) {
          continue;
        }
        results.push(user);
      }
    }
    return results;
  }

  public setUser(user: User): void {
    this.users.set(user.id.toString(), user);
  }
}

const executionContext: ExecutionContext = {
  tenantId: 'tenant-1',
  userId: 'user-1',
};

describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler;
  let userRepository: MockUserRepository;
  let eventBus: EventBus;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    eventBus = {
      publishAll: jest.fn<() => Promise<void>>(),
    } as unknown as EventBus;
    handler = new UpdateProfileHandler(userRepository, eventBus);
  });

  it('应更新用户资料', async () => {
    const user = User.create({
      tenantId: TenantId.create('tenant-1'),
      email: Email.create('user@example.com'),
      username: Username.create('john_doe'),
      passwordHash: PasswordHash.create('$2b$10$hash'),
      profile: UserProfile.create({ name: '张三', gender: 'MALE' }),
    });
    userRepository.setUser(user);

    const command = new UpdateProfileCommand(
      executionContext,
      user.id.toString(),
      {
        name: '李四',
        phoneNumber: '13800138000',
      },
    );
    const result = await handler.execute(command);

    expect(result.user).toBeDefined();
    expect(result.user.profile.name).toBe('李四');
    expect(result.user.profile.phoneNumber).toBe('13800138000');
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('应在用户不存在时抛出异常', async () => {
    const command = new UpdateProfileCommand(
      executionContext,
      AggregateId.generate().toString(),
      {
        name: '李四',
      },
    );

    await expect(handler.execute(command)).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
