import { PureAbility } from '@casl/ability';
import { GeneralForbiddenException } from '@hl8/exceptions';
import { AuditCoordinator } from '../../audit/audit-coordinator.js';
import { CaslAbilityCoordinator } from '../../casl/casl-ability-coordinator.js';
import type { AbilityService } from '../../interfaces/ability-service.interface.js';
import type { AuditService } from '../../interfaces/audit-service.interface.js';
import type { SecurityContext } from '../../interfaces/security-context.js';
import { CaslQueryHandler } from './casl-query-handler.base.js';
import { CaslQueryBase } from './casl-query.base.js';

class StubAbilityService implements AbilityService {
  public constructor(private readonly allow: boolean) {}

  public async resolveAbility(): Promise<
    PureAbility<[string, string], Record<string, unknown>>
  > {
    if (this.allow) {
      return new PureAbility<[string, string], Record<string, unknown>>([
        { action: 'read', subject: 'GetUserQuery' },
      ]);
    }
    return new PureAbility<[string, string], Record<string, unknown>>([]);
  }
}

class InMemoryAuditService {
  public records: Array<{
    action: string;
    payload?: Record<string, unknown>;
    result?: unknown;
  }> = [];

  public async append(
    _context: SecurityContext,
    record: {
      action: string;
      payload?: Record<string, unknown>;
      result?: unknown;
    },
  ): Promise<void> {
    this.records.push(record);
  }
}

class GetUserQuery extends CaslQueryBase<{ id: string; name: string }> {
  public constructor(
    context: SecurityContext,
    public readonly payload: { userId: string },
  ) {
    super(context);
  }

  public abilityDescriptor() {
    return { action: 'read', subject: 'GetUserQuery' };
  }

  public override auditPayload() {
    return this.payload;
  }
}

class GetUserQueryHandler extends CaslQueryHandler<
  GetUserQuery,
  { id: string; name: string }
> {
  public constructor(
    abilityCoordinator: CaslAbilityCoordinator,
    auditCoordinator: AuditCoordinator,
  ) {
    super(abilityCoordinator, auditCoordinator);
  }

  protected async handle(
    query: GetUserQuery,
  ): Promise<{ id: string; name: string }> {
    this.assertTenantScope(query, query.context.tenantId);
    return {
      id: query.payload.userId,
      name: 'Test User',
    };
  }
}

const securityContext: SecurityContext = {
  tenantId: 'tenant-1',
  userId: 'user-1',
};

describe('CaslQueryHandler', () => {
  it('允许权限通过时执行查询并写入审计', async () => {
    const abilityService = new StubAbilityService(true);
    const auditService = new InMemoryAuditService();
    const handler = new GetUserQueryHandler(
      new CaslAbilityCoordinator(abilityService),
      new AuditCoordinator(auditService as unknown as AuditService),
    );

    const result = await handler.execute(
      new GetUserQuery(securityContext, { userId: 'user-123' }),
    );

    expect(result).toEqual({ id: 'user-123', name: 'Test User' });
    expect(auditService.records).toHaveLength(1);
    expect(auditService.records[0]?.action).toBe('GetUserQuery');
    expect(auditService.records[0]?.payload).toEqual({ userId: 'user-123' });
    expect(auditService.records[0]?.result).toEqual({
      id: 'user-123',
      name: 'Test User',
    });
  });

  it('权限不足时抛出 GeneralForbiddenException', async () => {
    const abilityService = new StubAbilityService(false);
    const auditService = new InMemoryAuditService();
    const handler = new GetUserQueryHandler(
      new CaslAbilityCoordinator(abilityService),
      new AuditCoordinator(auditService as unknown as AuditService),
    );

    await expect(
      handler.execute(
        new GetUserQuery(securityContext, { userId: 'user-123' }),
      ),
    ).rejects.toBeInstanceOf(GeneralForbiddenException);
    expect(auditService.records).toHaveLength(0);
  });

  it('应该支持 assertTenantScope', async () => {
    const abilityService = new StubAbilityService(true);
    const auditService = new InMemoryAuditService();

    class GetUserQueryHandlerWithTenantCheck extends CaslQueryHandler<
      GetUserQuery,
      { id: string; name: string }
    > {
      public constructor(
        abilityCoordinator: CaslAbilityCoordinator,
        auditCoordinator: AuditCoordinator,
      ) {
        super(abilityCoordinator, auditCoordinator);
      }

      protected async handle(
        query: GetUserQuery,
      ): Promise<{ id: string; name: string }> {
        // 检查上下文租户是否与指定租户匹配
        this.assertTenantScope(query, 'tenant-1');
        return {
          id: query.payload.userId,
          name: 'Test User',
        };
      }
    }

    const handler = new GetUserQueryHandlerWithTenantCheck(
      new CaslAbilityCoordinator(abilityService),
      new AuditCoordinator(auditService as unknown as AuditService),
    );

    // 租户匹配，应该成功
    await handler.execute(
      new GetUserQuery(securityContext, { userId: 'user-123' }),
    );

    // 租户不匹配，应该抛出异常
    const wrongTenantContext: SecurityContext = {
      tenantId: 'tenant-2',
      userId: 'user-1',
    };

    await expect(
      handler.execute(
        new GetUserQuery(wrongTenantContext, { userId: 'user-123' }),
      ),
    ).rejects.toBeInstanceOf(GeneralForbiddenException);
  });

  it('应该支持 assertOrganizationScope', async () => {
    const abilityService = new StubAbilityService(true);
    const auditService = new InMemoryAuditService();

    class GetOrgUserQueryHandler extends CaslQueryHandler<
      GetUserQuery,
      { id: string; name: string }
    > {
      public constructor(
        abilityCoordinator: CaslAbilityCoordinator,
        auditCoordinator: AuditCoordinator,
      ) {
        super(abilityCoordinator, auditCoordinator);
      }

      protected async handle(
        query: GetUserQuery,
      ): Promise<{ id: string; name: string }> {
        this.assertOrganizationScope(query, 'org-1');
        return { id: query.payload.userId, name: 'Test User' };
      }
    }

    const handler = new GetOrgUserQueryHandler(
      new CaslAbilityCoordinator(abilityService),
      new AuditCoordinator(auditService as unknown as AuditService),
    );

    const contextWithOrg: SecurityContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      organizationIds: ['org-1', 'org-2'],
    };

    // 组织匹配，应该成功
    const result = await handler.execute(
      new GetUserQuery(contextWithOrg, { userId: 'user-123' }),
    );
    expect(result).toEqual({ id: 'user-123', name: 'Test User' });

    // 组织不匹配，应该抛出异常
    const contextWithoutOrg: SecurityContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };

    await expect(
      handler.execute(
        new GetUserQuery(contextWithoutOrg, { userId: 'user-123' }),
      ),
    ).rejects.toBeInstanceOf(GeneralForbiddenException);
  });

  it('应该支持 assertDepartmentScope', async () => {
    const abilityService = new StubAbilityService(true);
    const auditService = new InMemoryAuditService();

    class GetDeptUserQueryHandler extends CaslQueryHandler<
      GetUserQuery,
      { id: string; name: string }
    > {
      public constructor(
        abilityCoordinator: CaslAbilityCoordinator,
        auditCoordinator: AuditCoordinator,
      ) {
        super(abilityCoordinator, auditCoordinator);
      }

      protected async handle(
        query: GetUserQuery,
      ): Promise<{ id: string; name: string }> {
        this.assertDepartmentScope(query, 'dept-1');
        return { id: query.payload.userId, name: 'Test User' };
      }
    }

    const handler = new GetDeptUserQueryHandler(
      new CaslAbilityCoordinator(abilityService),
      new AuditCoordinator(auditService as unknown as AuditService),
    );

    const contextWithDept: SecurityContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      departmentIds: ['dept-1', 'dept-2'],
    };

    // 部门匹配，应该成功
    const result = await handler.execute(
      new GetUserQuery(contextWithDept, { userId: 'user-123' }),
    );
    expect(result).toEqual({ id: 'user-123', name: 'Test User' });

    // 部门不匹配，应该抛出异常
    const contextWithoutDept: SecurityContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };

    await expect(
      handler.execute(
        new GetUserQuery(contextWithoutDept, { userId: 'user-123' }),
      ),
    ).rejects.toBeInstanceOf(GeneralForbiddenException);
  });
});
