import type { ExecutionContext as CommonExecutionContext } from '@hl8/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { AuditCommandInterceptor } from './audit-command.interceptor.js';
import { AuditCoordinator } from './audit-coordinator.js';

const createExecutionContext = (
  request: Record<string, unknown>,
  handlerName = 'handle',
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
    getHandler: () => ({ name: handlerName }),
  }) as unknown as ExecutionContext;

const next = (result: unknown): CallHandler => ({
  handle: () => of(result),
});

describe('AuditCommandInterceptor', () => {
  const coordinator = {
    record: jest.fn<AuditCoordinator['record']>().mockResolvedValue(undefined),
  } as unknown as AuditCoordinator;

  let interceptor: AuditCommandInterceptor;
  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new AuditCommandInterceptor(coordinator);
  });

  it('passes through when execution context missing', async () => {
    const context = createExecutionContext({});
    const response = await lastValueFrom(
      interceptor.intercept(context, next('ok')),
    );

    expect(response).toBe('ok');
    expect(coordinator.record).not.toHaveBeenCalled();
  });

  it('records audit information when execution context present', async () => {
    const executionContext: CommonExecutionContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };
    const context = createExecutionContext(
      { executionContext, body: { foo: 'bar' } },
      'CreateUserCommand',
    );

    const result = await lastValueFrom(
      interceptor.intercept(context, next({ ok: true })),
    );

    expect(result).toEqual({ ok: true });
    expect(coordinator.record).toHaveBeenCalledWith(executionContext, {
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'CreateUserCommand',
      payload: { foo: 'bar' },
      result: { ok: true },
      metadata: { channel: 'command' },
    });
  });
});
