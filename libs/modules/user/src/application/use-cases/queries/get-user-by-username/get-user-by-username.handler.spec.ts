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
import { GetUserByUsernameHandler } from './get-user-by-username.handler.js';
import { GetUserByUsernameQuery } from './get-user-by-username.query.js';

class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  public async findById(): Promise<User | null> {
    return null;
  }

  public async findByEmail(): Promise<User | null> {
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

describe('GetUserByUsernameHandler', () => {
  let handler: GetUserByUsernameHandler;
  let userRepository: MockUserRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    handler = new GetUserByUsernameHandler(userRepository);
  });

  it('应根据用户名查询用户', async () => {
    const user = User.create({
      tenantId: TenantId.create('tenant-1'),
      email: Email.create('user@example.com'),
      username: Username.create('john_doe'),
      passwordHash: PasswordHash.create('$2b$10$hash'),
      profile: UserProfile.create({ name: '张三', gender: 'MALE' }),
    });
    userRepository.setUser(user);

    const query = new GetUserByUsernameQuery(executionContext, 'john_doe');
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.username).toBe('john_doe');
  });

  it('应在用户不存在时返回 null', async () => {
    const query = new GetUserByUsernameQuery(
      executionContext,
      'nonexistent_user',
    );
    const result = await handler.execute(query);

    expect(result).toBeNull();
  });
});
