import { PureAbility } from '@casl/ability';
import type {
  AbilityService,
  AuditService,
  SecurityContext,
} from '@hl8/application-base';
import {
  AuditCoordinator,
  CaslAbilityCoordinator,
} from '@hl8/application-base';
import { AggregateId, TenantId } from '@hl8/domain-base';
import { describe, expect, it } from '@jest/globals';
import { User } from '../../../../../domain/aggregates/user.aggregate.js';
import type { UserRepository } from '../../../../../domain/repositories/user.repository.js';
import {
  Email,
  PasswordHash,
  UserProfile,
  Username,
} from '../../../../../domain/value-objects/index.js';
import { GetUserByIdHandler } from './get-user-by-id.handler.js';
import { GetUserByIdQuery } from './get-user-by-id.query.js';

class StubAbilityService implements AbilityService {
  public constructor(private readonly allow: boolean = true) {}

  public async resolveAbility(): Promise<
    PureAbility<[string, string], Record<string, unknown>>
  > {
    if (this.allow) {
      return new PureAbility<[string, string], Record<string, unknown>>([
        { action: 'read', subject: 'User' },
      ]);
    }
    return new PureAbility<[string, string], Record<string, unknown>>([]);
  }
}

class InMemoryAuditService implements AuditService {
  public records: Array<{
    action: string;
    payload?: Record<string, unknown>;
  }> = [];

  public async append(
    _context: SecurityContext,
    record: { action: string; payload?: Record<string, unknown> },
  ): Promise<void> {
    this.records.push(record);
  }
}

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

  public setUser(user: User): void {
    this.users.set(user.id.toString(), user);
  }
}

const securityContext: SecurityContext = {
  tenantId: 'tenant-1',
  userId: 'user-1',
};

describe('GetUserByIdHandler', () => {
  let handler: GetUserByIdHandler;
  let userRepository: MockUserRepository;
  let abilityCoordinator: CaslAbilityCoordinator;
  let auditCoordinator: AuditCoordinator;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    abilityCoordinator = new CaslAbilityCoordinator(
      new StubAbilityService(true),
    );
    auditCoordinator = new AuditCoordinator(
      new InMemoryAuditService() as unknown as AuditService,
    );
    handler = new GetUserByIdHandler(
      abilityCoordinator,
      auditCoordinator,
      userRepository,
    );
  });

  it('应根据ID查询用户', async () => {
    const user = User.create({
      tenantId: TenantId.create('tenant-1'),
      email: Email.create('user@example.com'),
      username: Username.create('john_doe'),
      passwordHash: PasswordHash.create('$2b$10$hash'),
      profile: UserProfile.create({ name: '张三', gender: 'MALE' }),
    });
    userRepository.setUser(user);

    const query = new GetUserByIdQuery(securityContext, user.id.toString());
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.id).toBe(user.id.toString());
    expect(result?.email).toBe('user@example.com');
  });

  it('应在用户不存在时返回 null', async () => {
    const query = new GetUserByIdQuery(
      securityContext,
      AggregateId.generate().toString(),
    );
    const result = await handler.execute(query);

    expect(result).toBeNull();
  });
});
