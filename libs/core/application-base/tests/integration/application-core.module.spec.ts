import { AbilityBuilder, PureAbility } from '@casl/ability';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { lastValueFrom, of } from 'rxjs';
import { ApplicationCoreModule } from '../../src/application-core.module.js';
import { AuditCommandInterceptor } from '../../src/audit/audit-command.interceptor.js';
import { AuditCoordinator } from '../../src/audit/audit-coordinator.js';
import { AuditQueryInterceptor } from '../../src/audit/audit-query.interceptor.js';
import { CaslAbilityCoordinator } from '../../src/casl/casl-ability-coordinator.js';
import type {
  AbilityService,
  ApplicationAbility,
} from '../../src/interfaces/ability-service.interface.js';
import type {
  AuditRecord,
  AuditService,
} from '../../src/interfaces/audit-service.interface.js';
import type { SecurityContext } from '../../src/interfaces/security-context.js';
import {
  ABILITY_SERVICE_TOKEN,
  AUDIT_SERVICE_TOKEN,
} from '../../src/interfaces/tokens.js';

class TestAbilityService implements AbilityService {
  public async resolveAbility(
    context: SecurityContext,
  ): Promise<ApplicationAbility> {
    const builder = new AbilityBuilder(
      PureAbility<[string, string], Record<string, unknown>>,
    );
    builder.can('manage', 'MuteUserCommand');
    builder.can('read', 'FetchUserQuery');
    return builder.build() as ApplicationAbility;
  }
}

class TestAuditService implements AuditService {
  public records: AuditRecord[] = [];

  public async append(
    context: SecurityContext,
    record: AuditRecord,
  ): Promise<void> {
    this.records.push({
      ...record,
      tenantId: context.tenantId,
      userId: context.userId,
    });
  }
}

const securityContext: SecurityContext = {
  tenantId: 'tenant-100',
  userId: 'user-200',
};

describe('ApplicationCoreModule integration', () => {
  describe('注册所有组件（默认行为）', () => {
    it('应该注册所有协调器和拦截器', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ApplicationCoreModule.register({
            abilityService: {
              provide: ABILITY_SERVICE_TOKEN,
              useClass: TestAbilityService,
            },
            auditService: {
              provide: AUDIT_SERVICE_TOKEN,
              useClass: TestAuditService,
            },
          }),
        ],
      }).compile();

      const abilityCoordinator = moduleRef.get(CaslAbilityCoordinator);
      const auditCoordinator = moduleRef.get(AuditCoordinator);
      const auditService = moduleRef.get<TestAuditService>(AUDIT_SERVICE_TOKEN);

      await abilityCoordinator.ensureAuthorized(securityContext, {
        action: 'manage',
        subject: 'MuteUserCommand',
      });

      await auditCoordinator.record(securityContext, {
        tenantId: securityContext.tenantId,
        userId: securityContext.userId,
        action: 'MuteUserCommand',
      });

      expect(auditService.records).toHaveLength(1);
    });
  });

  describe('只注册权限相关组件', () => {
    it('应该只注册权限协调器，不注册审计相关组件', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ApplicationCoreModule.register({
            abilityService: {
              provide: ABILITY_SERVICE_TOKEN,
              useClass: TestAbilityService,
            },
            enableAudit: false,
          }),
        ],
      }).compile();

      // 权限相关组件应该可用
      const abilityCoordinator = moduleRef.get(CaslAbilityCoordinator);
      await abilityCoordinator.ensureAuthorized(securityContext, {
        action: 'manage',
        subject: 'MuteUserCommand',
      });

      // 审计相关组件应该不可用
      expect(() => moduleRef.get(AuditCoordinator)).toThrow();
      expect(() => moduleRef.get(AuditCommandInterceptor)).toThrow();
      expect(() => moduleRef.get(AuditQueryInterceptor)).toThrow();
      expect(() => moduleRef.get(AUDIT_SERVICE_TOKEN)).toThrow();
    });
  });

  describe('只注册审计相关组件', () => {
    it('应该只注册审计协调器和拦截器，不注册权限相关组件', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ApplicationCoreModule.register({
            auditService: {
              provide: AUDIT_SERVICE_TOKEN,
              useClass: TestAuditService,
            },
            enableAbility: false,
          }),
        ],
      }).compile();

      // 审计相关组件应该可用
      const auditCoordinator = moduleRef.get(AuditCoordinator);
      const auditCommandInterceptor = moduleRef.get(AuditCommandInterceptor);
      const auditQueryInterceptor = moduleRef.get(AuditQueryInterceptor);
      const auditService = moduleRef.get<TestAuditService>(AUDIT_SERVICE_TOKEN);

      await auditCoordinator.record(securityContext, {
        tenantId: securityContext.tenantId,
        userId: securityContext.userId,
        action: 'TestAction',
      });

      expect(auditService.records).toHaveLength(1);
      expect(auditCommandInterceptor).toBeDefined();
      expect(auditQueryInterceptor).toBeDefined();

      // 权限相关组件应该不可用
      expect(() => moduleRef.get(CaslAbilityCoordinator)).toThrow();
      expect(() => moduleRef.get(ABILITY_SERVICE_TOKEN)).toThrow();
    });
  });

  describe('不注册任何组件', () => {
    it('应该不注册任何组件', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ApplicationCoreModule.register({})],
      }).compile();

      // 所有组件都应该不可用
      expect(() => moduleRef.get(CaslAbilityCoordinator)).toThrow();
      expect(() => moduleRef.get(AuditCoordinator)).toThrow();
      expect(() => moduleRef.get(AuditCommandInterceptor)).toThrow();
      expect(() => moduleRef.get(AuditQueryInterceptor)).toThrow();
      expect(() => moduleRef.get(ABILITY_SERVICE_TOKEN)).toThrow();
      expect(() => moduleRef.get(AUDIT_SERVICE_TOKEN)).toThrow();
    });
  });

  describe('显式启用组件', () => {
    it('应该根据 enableAbility 和 enableAudit 选项注册组件', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ApplicationCoreModule.register({
            abilityService: {
              provide: ABILITY_SERVICE_TOKEN,
              useClass: TestAbilityService,
            },
            auditService: {
              provide: AUDIT_SERVICE_TOKEN,
              useClass: TestAuditService,
            },
            enableAbility: true,
            enableAudit: true,
          }),
        ],
      }).compile();

      // 所有组件都应该可用
      expect(moduleRef.get(CaslAbilityCoordinator)).toBeDefined();
      expect(moduleRef.get(AuditCoordinator)).toBeDefined();
      expect(moduleRef.get(AuditCommandInterceptor)).toBeDefined();
      expect(moduleRef.get(AuditQueryInterceptor)).toBeDefined();
      expect(moduleRef.get(ABILITY_SERVICE_TOKEN)).toBeDefined();
      expect(moduleRef.get(AUDIT_SERVICE_TOKEN)).toBeDefined();
    });

    it('应该只注册权限组件，即使提供了 auditService 但 enableAudit 为 false', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ApplicationCoreModule.register({
            abilityService: {
              provide: ABILITY_SERVICE_TOKEN,
              useClass: TestAbilityService,
            },
            auditService: {
              provide: AUDIT_SERVICE_TOKEN,
              useClass: TestAuditService,
            },
            enableAudit: false,
          }),
        ],
      }).compile();

      // 权限相关组件应该可用
      expect(moduleRef.get(CaslAbilityCoordinator)).toBeDefined();
      expect(moduleRef.get(ABILITY_SERVICE_TOKEN)).toBeDefined();

      // 审计相关组件应该不可用（即使提供了 auditService）
      expect(() => moduleRef.get(AuditCoordinator)).toThrow();
      expect(() => moduleRef.get(AuditCommandInterceptor)).toThrow();
      expect(() => moduleRef.get(AuditQueryInterceptor)).toThrow();
      expect(() => moduleRef.get(AUDIT_SERVICE_TOKEN)).toThrow();
    });
  });

  it('writes audit records through interceptors', async () => {
    const auditService = new TestAuditService();
    const auditCoordinator = new AuditCoordinator(auditService);
    const commandInterceptor = new AuditCommandInterceptor(auditCoordinator);
    const queryInterceptor = new AuditQueryInterceptor(auditCoordinator);

    const commandContext = createHttpContext({
      securityContext,
      body: { id: 'payload' },
    });
    await lastValueFrom(
      commandInterceptor.intercept(commandContext, { handle: () => of('ok') }),
    );

    const queryContext = createHttpContext({
      securityContext,
      query: { keyword: 'test' },
    });
    await lastValueFrom(
      queryInterceptor.intercept(queryContext, { handle: () => of('ok') }),
    );

    expect(auditService.records).toHaveLength(2);
  });
});

const createHttpContext = (
  request: Record<string, unknown>,
): ExecutionContext => {
  return {
    getClass: () => ({}) as any,
    getHandler: () => ({ name: 'TestHandler' }) as any,
    getType: () => 'http' as const,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    switchToRpc: () => ({ getData: () => ({}), getContext: () => ({}) }),
    switchToWs: () => ({
      getClient: () => ({}),
      getData: () => ({}),
      getPattern: () => '',
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
  } as ExecutionContext;
};
