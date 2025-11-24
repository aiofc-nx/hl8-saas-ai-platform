import { describe, expect, it, jest } from '@jest/globals';

// Mock @hl8/exceptions - 确保 mock 在导入之前
jest.mock('@hl8/exceptions', () => {
  class MissingConfigurationForFeatureException extends Error {
    constructor(
      message: string,
      public code?: string,
    ) {
      super(message);
      this.name = 'MissingConfigurationForFeatureException';
    }
  }

  class GeneralInternalServerException extends Error {
    constructor(
      message: string,
      public cause?: unknown,
    ) {
      super(message);
      this.name = 'GeneralInternalServerException';
    }
  }

  return {
    MissingConfigurationForFeatureException,
    GeneralInternalServerException,
  };
});

import type { ExecutionContext } from '@hl8/common';
import { MissingConfigurationForFeatureException } from '@hl8/exceptions';
import { of, throwError } from 'rxjs';
import type {
  AuditRecord,
  AuditService,
} from '../interfaces/audit-service.interface.js';
import { AuditCoordinator } from './audit-coordinator.js';
import { AuditRecordException } from './audit-record.exception.js';

const context: ExecutionContext = {
  tenantId: 'tenant-1',
  userId: 'user-1',
  metadata: { traceId: 'trace-1' },
};

const baseRecord: AuditRecord = {
  tenantId: 'external-tenant',
  userId: 'external-user',
  action: 'TestAction',
  payload: { foo: 'bar' },
  result: { success: true },
  metadata: { channel: 'command' },
} as const;

describe('AuditCoordinator', () => {
  it('throws when audit service not provided', async () => {
    const coordinator = new AuditCoordinator(undefined);
    await expect(
      coordinator.record(context, {
        ...baseRecord,
      }),
    ).rejects.toBeInstanceOf(MissingConfigurationForFeatureException);
  });

  it('merges metadata and delegates to audit service', async () => {
    const append = jest
      .fn<AuditService['append']>()
      .mockImplementation(() => Promise.resolve());
    const coordinator = new AuditCoordinator({
      append,
    } satisfies AuditService);

    await coordinator.record(context, baseRecord);

    expect(append).toHaveBeenCalledWith(context, {
      tenantId: context.tenantId,
      userId: context.userId,
      action: baseRecord.action,
      payload: baseRecord.payload,
      result: baseRecord.result,
      metadata: {
        traceId: 'trace-1',
        channel: 'command',
      },
    });
  });

  it('awaits observable results emitted by audit service', async () => {
    const append = jest
      .fn<AuditService['append']>()
      .mockReturnValue(of(undefined));
    const coordinator = new AuditCoordinator({
      append,
    } satisfies AuditService);

    await coordinator.record(context, baseRecord);

    expect(append).toHaveBeenCalledTimes(1);
  });

  it('wraps underlying errors into AuditRecordException', async () => {
    const underlyingError = new Error('append failed');
    const append = jest
      .fn<AuditService['append']>()
      .mockReturnValue(throwError(() => underlyingError));
    const coordinator = new AuditCoordinator({
      append,
    } satisfies AuditService);

    await expect(coordinator.record(context, baseRecord)).rejects.toThrow(
      AuditRecordException,
    );
  });
});
