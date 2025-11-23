import {
  GeneralBadRequestException,
  GeneralForbiddenException,
} from '@hl8/exceptions';
import { describe, expect, it } from '@jest/globals';
import {
  assertDepartmentScope,
  assertOrganizationScope,
  assertSecurityContext,
  assertTenantScope,
  type SecurityContext,
} from './security-context.js';

describe('SecurityContext', () => {
  const validContext: SecurityContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
  };

  describe('assertSecurityContext', () => {
    it('应该通过有效的安全上下文', () => {
      const result = assertSecurityContext(validContext);

      expect(result).toEqual(validContext);
    });

    it('当上下文为 null 时应该抛出异常', () => {
      expect(() => assertSecurityContext(null)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('当上下文为 undefined 时应该抛出异常', () => {
      expect(() => assertSecurityContext(undefined)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('当缺少 tenantId 时应该抛出异常', () => {
      const invalidContext = {
        userId: 'user-1',
      } as SecurityContext;

      expect(() => assertSecurityContext(invalidContext)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('当 tenantId 为空字符串时应该抛出异常', () => {
      const invalidContext: SecurityContext = {
        tenantId: '',
        userId: 'user-1',
      };

      expect(() => assertSecurityContext(invalidContext)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('当缺少 userId 时应该抛出异常', () => {
      const invalidContext = {
        tenantId: 'tenant-1',
      } as SecurityContext;

      expect(() => assertSecurityContext(invalidContext)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('当 userId 为空字符串时应该抛出异常', () => {
      const invalidContext: SecurityContext = {
        tenantId: 'tenant-1',
        userId: '',
      };

      expect(() => assertSecurityContext(invalidContext)).toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该支持包含可选字段的完整上下文', () => {
      const fullContext: SecurityContext = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        organizationIds: ['org-1'],
        departmentIds: ['dept-1'],
        metadata: { traceId: 'trace-123' },
      };

      const result = assertSecurityContext(fullContext);

      expect(result).toEqual(fullContext);
    });
  });

  describe('assertTenantScope', () => {
    it('当租户匹配时应该通过', () => {
      expect(() => assertTenantScope(validContext, 'tenant-1')).not.toThrow();
    });

    it('当租户不匹配时应该抛出异常', () => {
      expect(() => assertTenantScope(validContext, 'tenant-2')).toThrow(
        GeneralForbiddenException,
      );
      expect(() => assertTenantScope(validContext, 'tenant-2')).toThrow(
        '禁止跨租户访问资源',
      );
    });

    it('应该支持自定义错误消息', () => {
      const customMessage = '自定义错误消息';

      expect(() =>
        assertTenantScope(validContext, 'tenant-2', customMessage),
      ).toThrow(GeneralForbiddenException);
      expect(() =>
        assertTenantScope(validContext, 'tenant-2', customMessage),
      ).toThrow(customMessage);
    });

    it('当上下文无效时应该先抛出 BadRequestException', () => {
      const invalidContext = {
        userId: 'user-1',
      } as SecurityContext;

      expect(() => assertTenantScope(invalidContext, 'tenant-1')).toThrow(
        GeneralBadRequestException,
      );
    });
  });

  describe('assertOrganizationScope', () => {
    const contextWithOrg: SecurityContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      organizationIds: ['org-1', 'org-2'],
    };

    it('当组织匹配时应该通过', () => {
      expect(() =>
        assertOrganizationScope(contextWithOrg, 'org-1'),
      ).not.toThrow();
      expect(() =>
        assertOrganizationScope(contextWithOrg, 'org-2'),
      ).not.toThrow();
    });

    it('当组织不匹配时应该抛出异常', () => {
      expect(() => assertOrganizationScope(contextWithOrg, 'org-3')).toThrow(
        GeneralForbiddenException,
      );
      expect(() => assertOrganizationScope(contextWithOrg, 'org-3')).toThrow(
        '禁止跨组织访问资源',
      );
    });

    it('当上下文没有 organizationIds 时应该抛出异常', () => {
      expect(() => assertOrganizationScope(validContext, 'org-1')).toThrow(
        GeneralForbiddenException,
      );
    });

    it('当 organizationIds 为空数组时应该抛出异常', () => {
      const contextWithEmptyOrg: SecurityContext = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        organizationIds: [],
      };

      expect(() =>
        assertOrganizationScope(contextWithEmptyOrg, 'org-1'),
      ).toThrow(GeneralForbiddenException);
    });

    it('应该支持自定义错误消息', () => {
      const customMessage = '自定义组织错误消息';

      expect(() =>
        assertOrganizationScope(contextWithOrg, 'org-3', customMessage),
      ).toThrow(GeneralForbiddenException);
      expect(() =>
        assertOrganizationScope(contextWithOrg, 'org-3', customMessage),
      ).toThrow(customMessage);
    });
  });

  describe('assertDepartmentScope', () => {
    const contextWithDept: SecurityContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      departmentIds: ['dept-1', 'dept-2'],
    };

    it('当部门匹配时应该通过', () => {
      expect(() =>
        assertDepartmentScope(contextWithDept, 'dept-1'),
      ).not.toThrow();
      expect(() =>
        assertDepartmentScope(contextWithDept, 'dept-2'),
      ).not.toThrow();
    });

    it('当部门不匹配时应该抛出异常', () => {
      expect(() => assertDepartmentScope(contextWithDept, 'dept-3')).toThrow(
        GeneralForbiddenException,
      );
      expect(() => assertDepartmentScope(contextWithDept, 'dept-3')).toThrow(
        '禁止跨部门访问资源',
      );
    });

    it('当上下文没有 departmentIds 时应该抛出异常', () => {
      expect(() => assertDepartmentScope(validContext, 'dept-1')).toThrow(
        GeneralForbiddenException,
      );
    });

    it('当 departmentIds 为空数组时应该抛出异常', () => {
      const contextWithEmptyDept: SecurityContext = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        departmentIds: [],
      };

      expect(() =>
        assertDepartmentScope(contextWithEmptyDept, 'dept-1'),
      ).toThrow(GeneralForbiddenException);
    });

    it('应该支持自定义错误消息', () => {
      const customMessage = '自定义部门错误消息';

      expect(() =>
        assertDepartmentScope(contextWithDept, 'dept-3', customMessage),
      ).toThrow(GeneralForbiddenException);
      expect(() =>
        assertDepartmentScope(contextWithDept, 'dept-3', customMessage),
      ).toThrow(customMessage);
    });
  });
});
