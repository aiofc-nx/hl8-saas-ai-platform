import type { ExecutionContext } from '@hl8/application-base';
import {
  AggregateId,
  RepositoryFindByCriteria,
  TenantId,
} from '@hl8/domain-base';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { User } from '../../../../domain/aggregates/user.aggregate.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import {
  Email,
  PasswordHash,
  UserProfile,
  Username,
} from '../../../../domain/value-objects/index.js';
import { GetUserByEmailHandler } from './get-user-by-email.handler.js';
import { GetUserByEmailQuery } from './get-user-by-email.query.js';

class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  public async findById(): Promise<User | null> {
    return null;
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

  public async delete(): Promise<void> {
    // no-op
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

describe('GetUserByEmailHandler', () => {
  let handler: GetUserByEmailHandler;
  let userRepository: MockUserRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    handler = new GetUserByEmailHandler(userRepository);
  });

  it('应根据邮箱查询用户', async () => {
    const user = User.create({
      tenantId: TenantId.create('tenant-1'),
      email: Email.create('user@example.com'),
      username: Username.create('john_doe'),
      passwordHash: PasswordHash.create('$2b$10$hash'),
      profile: UserProfile.create({ name: '张三', gender: 'MALE' }),
    });
    userRepository.setUser(user);

    const query = new GetUserByEmailQuery(executionContext, 'user@example.com');
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.email).toBe('user@example.com');
  });

  it('应在用户不存在时返回 null', async () => {
    const query = new GetUserByEmailQuery(
      executionContext,
      'nonexistent@example.com',
    );
    const result = await handler.execute(query);

    expect(result).toBeNull();
  });
});
