import { describe, expect, it, jest } from '@jest/globals';

// Mock @hl8/exceptions - 确保 mock 在导入之前
jest.mock('@hl8/exceptions', () => {
  class GeneralBadRequestException extends Error {
    constructor(
      message: string | { field?: string; message: string },
      public code?: string,
    ) {
      super(typeof message === 'string' ? message : message.message);
      this.name = 'GeneralBadRequestException';
    }
  }

  class GeneralForbiddenException extends Error {
    constructor(
      message: string,
      public code?: string,
    ) {
      super(message);
      this.name = 'GeneralForbiddenException';
    }
  }

  return {
    GeneralBadRequestException,
    GeneralForbiddenException,
  };
});

import {
  GeneralBadRequestException,
  GeneralForbiddenException,
} from '@hl8/exceptions';
import {
  assertDepartmentScope,
  assertExecutionContext,
  assertOrganizationScope,
  assertTenantScope,
  type ExecutionContext,
} from './execution-context.js';

describe('ExecutionContext', () => {
  const validContext: ExecutionContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    organizationIds: ['org-1', 'org-2'],
    departmentIds: ['dept-1'],
  };

  describe('assertExecutionContext', () => {
    it('应该通过有效的上下文', () => {
      expect(assertExecutionContext(validContext)).toEqual(validContext);
    });

    it('应该抛出异常当上下文为 null', () => {
      expect(() => assertExecutionContext(null)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该抛出异常当上下文为 undefined', () => {
      expect(() => assertExecutionContext(undefined)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该抛出异常当缺少 tenantId', () => {
      const context = { ...validContext, tenantId: '' };
      expect(() => assertExecutionContext(context)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该抛出异常当缺少 userId', () => {
      const context = { ...validContext, userId: '' };
      expect(() => assertExecutionContext(context)).toThrow(
        GeneralBadRequestException,
      );
    });
  });

  describe('assertTenantScope', () => {
    it('应该通过当租户匹配', () => {
      expect(() => assertTenantScope(validContext, 'tenant-1')).not.toThrow();
    });

    it('应该抛出异常当租户不匹配', () => {
      expect(() => assertTenantScope(validContext, 'tenant-2')).toThrow(
        GeneralForbiddenException,
      );
    });
  });

  describe('assertOrganizationScope', () => {
    it('应该通过当组织在列表中', () => {
      expect(() =>
        assertOrganizationScope(validContext, 'org-1'),
      ).not.toThrow();
    });

    it('应该抛出异常当组织不在列表中', () => {
      expect(() => assertOrganizationScope(validContext, 'org-3')).toThrow(
        GeneralForbiddenException,
      );
    });

    it('应该抛出异常当组织列表为空', () => {
      const context = { ...validContext, organizationIds: undefined };
      expect(() => assertOrganizationScope(context, 'org-1')).toThrow(
        GeneralForbiddenException,
      );
    });
  });

  describe('assertDepartmentScope', () => {
    it('应该通过当部门在列表中', () => {
      expect(() => assertDepartmentScope(validContext, 'dept-1')).not.toThrow();
    });

    it('应该抛出异常当部门不在列表中', () => {
      expect(() => assertDepartmentScope(validContext, 'dept-2')).toThrow(
        GeneralForbiddenException,
      );
    });

    it('应该抛出异常当部门列表为空', () => {
      const context = { ...validContext, departmentIds: undefined };
      expect(() => assertDepartmentScope(context, 'dept-1')).toThrow(
        GeneralForbiddenException,
      );
    });
  });
});
