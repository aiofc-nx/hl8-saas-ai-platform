import { describe, expect, it } from '@jest/globals';

import { DomainException } from '../exceptions/domain.exception.js';
import { TenantId } from './tenant-id.vo.js';

describe('TenantId', () => {
  describe('create', () => {
    it('应创建租户标识', () => {
      const tenantId = TenantId.create('tenant_1');

      expect(tenantId.value).toBe('tenant_1');
    });

    it('应去除前后空白字符', () => {
      const tenantId = TenantId.create('  tenant_1  ');

      expect(tenantId.value).toBe('tenant_1');
    });

    it('应在值为空字符串时抛出异常', () => {
      expect(() => TenantId.create('')).toThrow(DomainException);
    });

    it('应在值为仅空白字符时抛出异常', () => {
      expect(() => TenantId.create('   ')).toThrow(DomainException);
      expect(() => TenantId.create('\t\n')).toThrow(DomainException);
    });
  });

  describe('toString', () => {
    it('应返回标识值', () => {
      const tenantId = TenantId.create('tenant_1');

      expect(tenantId.toString()).toBe('tenant_1');
    });
  });

  describe('equals', () => {
    it('应在值相同时返回 true', () => {
      const id1 = TenantId.create('tenant_1');
      const id2 = TenantId.create('tenant_1');

      expect(id1.equals(id2)).toBe(true);
    });

    it('应在值不同时返回 false', () => {
      const id1 = TenantId.create('tenant_1');
      const id2 = TenantId.create('tenant_2');

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
