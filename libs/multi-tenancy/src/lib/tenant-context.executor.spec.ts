import { GeneralUnauthorizedException } from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ClsService } from 'nestjs-cls';
import type { TenantClsStore } from './tenant-cls-store.js';
import { TenantContextExecutor } from './tenant-context.executor.js';

describe('TenantContextExecutor', () => {
  let executor: TenantContextExecutor;
  let clsService: jest.Mocked<ClsService<TenantClsStore>>;
  let logger: jest.Mocked<InstanceType<typeof Logger>>;

  beforeEach(() => {
    clsService = {
      get: jest.fn(),
      set: jest.fn(),
      run: jest.fn(),
    } as unknown as jest.Mocked<ClsService<TenantClsStore>>;

    logger = {
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
    } as unknown as jest.Mocked<InstanceType<typeof Logger>>;

    executor = new TenantContextExecutor(clsService, logger);
  });

  describe('getTenantIdOrFail', () => {
    it('应成功返回租户 ID', () => {
      const tenantId = 'tenant-123';
      clsService.get.mockReturnValue(tenantId);

      const result = executor.getTenantIdOrFail();

      expect(result).toBe(tenantId);
      expect(clsService.get).toHaveBeenCalledWith('tenantId');
    });

    it('当租户 ID 不存在时应抛出异常', () => {
      clsService.get.mockReturnValue(undefined);

      expect(() => executor.getTenantIdOrFail()).toThrow(
        GeneralUnauthorizedException,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '缺少租户上下文，无法解析请求所属租户',
      );
    });

    it('当租户 ID 为空字符串时应抛出异常', () => {
      clsService.get.mockReturnValue('');

      expect(() => executor.getTenantIdOrFail()).toThrow(
        GeneralUnauthorizedException,
      );
    });

    it('当租户 ID 为 null 时应抛出异常', () => {
      clsService.get.mockReturnValue(null);

      expect(() => executor.getTenantIdOrFail()).toThrow(
        GeneralUnauthorizedException,
      );
    });
  });

  describe('runWithTenantContext', () => {
    it('应在新的 CLS 作用域下执行回调并设置租户 ID', async () => {
      const tenantId = 'tenant-456';
      const handler = jest.fn().mockResolvedValue('result');
      const runCallback = jest.fn((fn) => fn());

      clsService.run.mockImplementation(runCallback);

      const result = await executor.runWithTenantContext(tenantId, handler);

      expect(result).toBe('result');
      expect(clsService.run).toHaveBeenCalled();
      expect(clsService.set).toHaveBeenCalledWith('tenantId', tenantId);
      expect(handler).toHaveBeenCalled();
    });

    it('应设置额外的 userId', async () => {
      const tenantId = 'tenant-789';
      const userId = 'user-123';
      const handler = jest.fn().mockResolvedValue('result');
      const runCallback = jest.fn((fn) => fn());

      clsService.run.mockImplementation(runCallback);

      await executor.runWithTenantContext(tenantId, handler, { userId });

      expect(clsService.set).toHaveBeenCalledWith('tenantId', tenantId);
      expect(clsService.set).toHaveBeenCalledWith('userId', userId);
    });

    it('应设置额外的 tenantSnapshot', async () => {
      const tenantId = 'tenant-101';
      const snapshot = { name: '测试租户', plan: 'premium' };
      const handler = jest.fn().mockResolvedValue('result');
      const runCallback = jest.fn((fn) => fn());

      clsService.run.mockImplementation(runCallback);

      await executor.runWithTenantContext(tenantId, handler, {
        tenantSnapshot: snapshot,
      });

      expect(clsService.set).toHaveBeenCalledWith('tenantId', tenantId);
      expect(clsService.set).toHaveBeenCalledWith('tenantSnapshot', snapshot);
    });

    it('应设置所有额外字段', async () => {
      const tenantId = 'tenant-202';
      const userId = 'user-456';
      const snapshot = { name: '测试租户' };
      const handler = jest.fn().mockResolvedValue('result');
      const runCallback = jest.fn((fn) => fn());

      clsService.run.mockImplementation(runCallback);

      await executor.runWithTenantContext(tenantId, handler, {
        userId,
        tenantSnapshot: snapshot,
      });

      expect(clsService.set).toHaveBeenCalledWith('tenantId', tenantId);
      expect(clsService.set).toHaveBeenCalledWith('userId', userId);
      expect(clsService.set).toHaveBeenCalledWith('tenantSnapshot', snapshot);
    });

    it('当回调抛出异常时应传播异常', async () => {
      const tenantId = 'tenant-303';
      const error = new Error('业务逻辑错误');
      const handler = jest.fn().mockRejectedValue(error);
      const runCallback = jest.fn((fn) => fn());

      clsService.run.mockImplementation(runCallback);

      await expect(
        executor.runWithTenantContext(tenantId, handler),
      ).rejects.toThrow('业务逻辑错误');
    });

    it('当 userId 未提供时不应设置 userId', async () => {
      const tenantId = 'tenant-404';
      const handler = jest.fn().mockResolvedValue('result');
      const runCallback = jest.fn((fn) => fn());

      clsService.run.mockImplementation(runCallback);

      await executor.runWithTenantContext(tenantId, handler, {});

      expect(clsService.set).toHaveBeenCalledWith('tenantId', tenantId);
      expect(clsService.set).not.toHaveBeenCalledWith(
        'userId',
        expect.anything(),
      );
    });
  });
});
