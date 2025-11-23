import { GeneralBadRequestException } from '@hl8/exceptions';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ArgumentsHost, ExecutionContext, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { SecurityContext } from '../interfaces/security-context.js';
import type { AbilityDescriptor } from './ability-descriptor.js';
import { CaslAbilityCoordinator } from './casl-ability-coordinator.js';
import { CaslAbilityGuard } from './casl-ability.guard.js';

const createExecutionContext = (
  request: Record<string, unknown>,
): ExecutionContext => {
  const httpContext = {
    getRequest: () => request,
    getResponse: () => ({}),
    getNext: () => ({}),
  } as ReturnType<ArgumentsHost['switchToHttp']>;

  const context: Partial<ExecutionContext> = {
    switchToHttp: () => httpContext,
    getHandler: () => (() => {}) as () => unknown,
    getClass: () => class {} as Type<any>,
  };

  return context as ExecutionContext;
};

describe('CaslAbilityGuard', () => {
  let guard: CaslAbilityGuard;
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const abilityCoordinator = {
    ensureAuthorized: jest
      .fn<CaslAbilityCoordinator['ensureAuthorized']>()
      .mockResolvedValue(undefined),
  } as unknown as CaslAbilityCoordinator;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new CaslAbilityGuard(reflector, abilityCoordinator);
  });

  it('allows request when no ability metadata is defined', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const canActivate = await guard.canActivate(createExecutionContext({}));

    expect(canActivate).toBe(true);
    expect(abilityCoordinator.ensureAuthorized).not.toHaveBeenCalled();
  });

  it('throws when security context is missing', async () => {
    const descriptor: AbilityDescriptor = {
      action: 'manage',
      subject: 'Tenant',
    };
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(descriptor);

    await expect(
      guard.canActivate(createExecutionContext({})),
    ).rejects.toBeInstanceOf(GeneralBadRequestException);

    expect(abilityCoordinator.ensureAuthorized).not.toHaveBeenCalled();
  });

  it('delegates authorization to coordinator when context present', async () => {
    const descriptor: AbilityDescriptor = {
      action: 'manage',
      subject: 'Tenant',
    };
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(descriptor);
    const securityContext: SecurityContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };

    const result = await guard.canActivate(
      createExecutionContext({ securityContext }),
    );

    expect(result).toBe(true);
    expect(abilityCoordinator.ensureAuthorized).toHaveBeenCalledWith(
      securityContext,
      descriptor,
    );
  });
});
