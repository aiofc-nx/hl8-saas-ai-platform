import type { ExecutionContext } from '@hl8/application-base';
import {
  AggregateId,
  RepositoryFindByCriteria,
  TenantId,
} from '@hl8/domain-base';
import { describe, expect, it, jest } from '@jest/globals';
import { EventBus } from '@nestjs/cqrs';
import { User } from '../../../../domain/aggregates/user.aggregate.js';
import { UserAlreadyExistsException } from '../../../../domain/exceptions/user-domain.exception.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import {
  Email,
  PasswordHash,
  UserProfile,
  Username,
} from '../../../../domain/value-objects/index.js';
import { CreateUserCommand } from './create-user.command.js';
import { CreateUserHandler } from './create-user.handler.js';

class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  public async findById(id: AggregateId): Promise<User | null> {
    return this.users.get(id.toString()) ?? null;
  }

  public async findByEmail(
    email: Email,
    tenantId: TenantId,
  ): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.equals(email) && user.tenantId.equals(tenantId)) {
        return user;
      }
    }
    return null;
  }

  public async findByUsername(
    username: Username,
    tenantId: TenantId,
  ): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username.equals(username) && user.tenantId.equals(tenantId)) {
        return user;
      }
    }
    return null;
  }

  public async existsByEmail(
    email: Email,
    tenantId: TenantId,
  ): Promise<boolean> {
    return (await this.findByEmail(email, tenantId)) !== null;
  }

  public async existsByUsername(
    username: Username,
    tenantId: TenantId,
  ): Promise<boolean> {
    return (await this.findByUsername(username, tenantId)) !== null;
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

  public clear(): void {
    this.users.clear();
  }
}

const executionContext: ExecutionContext = {
  tenantId: 'tenant-1',
  userId: 'user-1',
};

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let userRepository: MockUserRepository;
  let eventBus: EventBus;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    eventBus = {
      publishAll: jest.fn<() => Promise<void>>(),
    } as unknown as EventBus;
    handler = new CreateUserHandler(userRepository, eventBus);
  });

  it('应创建新用户', async () => {
    const command = new CreateUserCommand(
      executionContext,
      'user@example.com',
      'john_doe',
      '$2b$10$hash',
      {
        name: '张三',
        gender: 'MALE',
      },
    );

    const result = await handler.execute(command);

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('user@example.com');
    expect(result.user.username).toBe('john_doe');
    expect(result.user.status).toBe('PENDING_ACTIVATION');
    expect(
      userRepository.findById(AggregateId.fromString(result.user.id)),
    ).resolves.toBeDefined();
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('应在邮箱已存在时抛出异常', async () => {
    const existingUser = User.create({
      tenantId: TenantId.create('tenant-1'),
      email: Email.create('user@example.com'),
      username: Username.create('existing_user'),
      passwordHash: PasswordHash.create('$2b$10$hash'),
      profile: UserProfile.create({ name: 'Existing', gender: 'MALE' }),
    });
    await userRepository.save(existingUser);

    const command = new CreateUserCommand(
      executionContext,
      'user@example.com',
      'john_doe',
      '$2b$10$hash',
      {
        name: '张三',
        gender: 'MALE',
      },
    );

    await expect(handler.execute(command)).rejects.toThrow(
      UserAlreadyExistsException,
    );
  });

  it('应在用户名已存在时抛出异常', async () => {
    const existingUser = User.create({
      tenantId: TenantId.create('tenant-1'),
      email: Email.create('existing@example.com'),
      username: Username.create('john_doe'),
      passwordHash: PasswordHash.create('$2b$10$hash'),
      profile: UserProfile.create({ name: 'Existing', gender: 'MALE' }),
    });
    await userRepository.save(existingUser);

    const command = new CreateUserCommand(
      executionContext,
      'user@example.com',
      'john_doe',
      '$2b$10$hash',
      {
        name: '张三',
        gender: 'MALE',
      },
    );

    await expect(handler.execute(command)).rejects.toThrow(
      UserAlreadyExistsException,
    );
  });
});
