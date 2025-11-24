import type { ExecutionContext as CommonExecutionContext } from '@hl8/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { AuditCoordinator } from './audit-coordinator.js';
import { AuditQueryInterceptor } from './audit-query.interceptor.js';

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

describe('AuditQueryInterceptor', () => {
  const coordinator = {
    record: jest.fn<AuditCoordinator['record']>().mockResolvedValue(undefined),
  } as unknown as AuditCoordinator;

  let interceptor: AuditQueryInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new AuditQueryInterceptor(coordinator);
  });

  it('returns original response when execution context missing', async () => {
    const context = createExecutionContext({});
    const response = await lastValueFrom(
      interceptor.intercept(context, next('ok')),
    );

    expect(response).toBe('ok');
    expect(coordinator.record).not.toHaveBeenCalled();
  });

  it('records query audit when execution context exists', async () => {
    const executionContext: CommonExecutionContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };
    const context = createExecutionContext(
      { executionContext, query: { keyword: 'abc' } },
      'FindUserQuery',
    );

    const result = await lastValueFrom(
      interceptor.intercept(context, next({ data: [] })),
    );

    expect(result).toEqual({ data: [] });
    expect(coordinator.record).toHaveBeenCalledWith(executionContext, {
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'FindUserQuery',
      payload: { keyword: 'abc' },
      result: { data: [] },
      metadata: { channel: 'query' },
    });
  });
});
