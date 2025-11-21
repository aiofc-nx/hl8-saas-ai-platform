import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type {
  CacheLogger,
  CacheLoggerWithChild,
} from '../types/logger.types.js';
import {
  CacheNotificationService,
  type CacheInvalidationNotification,
  type CacheLockContentionNotification,
  type CachePrefetchNotification,
  type CachePrefetchResult,
} from './cache-notification.service.js';

/**
 * @description 创建日志器 Stub
 */
const createLoggerStub = () => {
  const stub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  stub.child = jest.fn().mockReturnValue(stub);
  return stub as unknown as CacheLogger;
};

/**
 * @description 创建带 child 方法的日志器 Stub
 */
const createLoggerWithChildStub = () => {
  const stub = createLoggerStub();
  return stub as unknown as CacheLoggerWithChild;
};

/**
 * @description 创建不带 child 方法的日志器 Stub
 */
const createLoggerWithoutChildStub = () => {
  const stub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  return stub as unknown as CacheLogger;
};

describe('CacheNotificationService', () => {
  let logger: CacheLogger;
  let service: CacheNotificationService;

  beforeEach(() => {
    logger = createLoggerWithChildStub();
    service = new CacheNotificationService(logger);
  });

  describe('构造函数', () => {
    it('应该在 logger 有 child 方法时创建子日志器', () => {
      const loggerWithChild = createLoggerWithChildStub();
      const childSpy = jest.spyOn(loggerWithChild as any, 'child');

      const newService = new CacheNotificationService(loggerWithChild);

      expect(childSpy).toHaveBeenCalledWith({
        context: CacheNotificationService.name,
      });
    });

    it('应该在 logger 没有 child 方法时直接使用原日志器', () => {
      const loggerWithoutChild = createLoggerWithoutChildStub();

      const newService = new CacheNotificationService(loggerWithoutChild);

      expect(newService).toBeInstanceOf(CacheNotificationService);
    });

    it('应该在 logger.child 为 undefined 时使用原日志器', () => {
      const loggerStub = createLoggerStub();
      (loggerStub as any).child = undefined;

      const newService = new CacheNotificationService(loggerStub);

      expect(newService).toBeInstanceOf(CacheNotificationService);
    });
  });

  describe('publishInvalidation', () => {
    it('应该发布缓存失效通知', async () => {
      const payload: CacheInvalidationNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        reason: '配置更新',
      };

      await service.publishInvalidation(payload);

      expect(logger.log).toHaveBeenCalledWith('缓存失效通知已发送', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        reason: '配置更新',
      });
    });

    it('应该支持带 requestId 的通知', async () => {
      const payload: CacheInvalidationNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        reason: '配置更新',
        requestId: 'req-123',
      };

      await service.publishInvalidation(payload);

      expect(logger.log).toHaveBeenCalledWith('缓存失效通知已发送', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        reason: '配置更新',
        requestId: 'req-123',
      });
    });

    it('应该支持多个 keys 的通知', async () => {
      const payload: CacheInvalidationNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [
          'tenant-config:tenant-001:config',
          'tenant-config:tenant-001:feature',
        ],
        reason: '批量配置更新',
      };

      await service.publishInvalidation(payload);

      expect(logger.log).toHaveBeenCalledWith('缓存失效通知已发送', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [
          'tenant-config:tenant-001:config',
          'tenant-config:tenant-001:feature',
        ],
        reason: '批量配置更新',
      });
    });

    it('应该支持空的 keys 数组', async () => {
      const payload: CacheInvalidationNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [],
        reason: '全量失效',
      };

      await service.publishInvalidation(payload);

      expect(logger.log).toHaveBeenCalledWith('缓存失效通知已发送', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [],
        reason: '全量失效',
      });
    });

    it('应该正确处理各种载荷参数', async () => {
      const payload: CacheInvalidationNotification = {
        domain: 'user-profile',
        tenantId: 'tenant-002',
        keys: ['user-profile:tenant-002:profile:user-123'],
        reason: '用户资料更新',
      };

      await service.publishInvalidation(payload);

      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith('缓存失效通知已发送', {
        domain: 'user-profile',
        tenantId: 'tenant-002',
        keys: ['user-profile:tenant-002:profile:user-123'],
        reason: '用户资料更新',
      });
    });
  });

  describe('publishLockContention', () => {
    it('应该发布锁竞争告警', async () => {
      const payload: CacheLockContentionNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        lockResource: 'lock:cache:tenant-config:tenant-001',
      };

      await service.publishLockContention(payload);

      expect(logger.warn).toHaveBeenCalledWith('检测到缓存锁竞争，已触发告警', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        lockResource: 'lock:cache:tenant-config:tenant-001',
      });
    });

    it('应该支持多个 keys 的锁竞争告警', async () => {
      const payload: CacheLockContentionNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [
          'tenant-config:tenant-001:config',
          'tenant-config:tenant-001:feature',
        ],
        lockResource: 'lock:cache:tenant-config:tenant-001',
      };

      await service.publishLockContention(payload);

      expect(logger.warn).toHaveBeenCalledWith('检测到缓存锁竞争，已触发告警', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [
          'tenant-config:tenant-001:config',
          'tenant-config:tenant-001:feature',
        ],
        lockResource: 'lock:cache:tenant-config:tenant-001',
      });
    });

    it('应该正确处理各种载荷参数', async () => {
      const payload: CacheLockContentionNotification = {
        domain: 'user-profile',
        tenantId: 'tenant-002',
        keys: ['user-profile:tenant-002:profile:user-123'],
        lockResource: 'lock:cache:user-profile:tenant-002',
      };

      await service.publishLockContention(payload);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith('检测到缓存锁竞争，已触发告警', {
        domain: 'user-profile',
        tenantId: 'tenant-002',
        keys: ['user-profile:tenant-002:profile:user-123'],
        lockResource: 'lock:cache:user-profile:tenant-002',
      });
    });
  });

  describe('publishPrefetchRequested', () => {
    it('应该发布缓存预取事件并返回结果', async () => {
      const payload: CachePrefetchNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
      };

      const result = await service.publishPrefetchRequested(payload);

      expect(result).toEqual({
        refreshed: 1,
        failures: [],
      });

      expect(logger.log).toHaveBeenCalledWith('缓存预取事件已广播', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
      });
    });

    it('应该返回正确的刷新统计', async () => {
      const payload: CachePrefetchNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [
          'tenant-config:tenant-001:config',
          'tenant-config:tenant-001:feature',
          'tenant-config:tenant-001:profile',
        ],
      };

      const result = await service.publishPrefetchRequested(payload);

      expect(result).toEqual({
        refreshed: 3,
        failures: [],
      });
    });

    it('应该支持 bypassLock 参数', async () => {
      const payload: CachePrefetchNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        bypassLock: true,
      };

      const result = await service.publishPrefetchRequested(payload);

      expect(result).toEqual({
        refreshed: 1,
        failures: [],
      });

      expect(logger.log).toHaveBeenCalledWith('缓存预取事件已广播', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['tenant-config:tenant-001:config'],
        bypassLock: true,
      });
    });

    it('应该支持空的 keys 数组', async () => {
      const payload: CachePrefetchNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [],
      };

      const result = await service.publishPrefetchRequested(payload);

      expect(result).toEqual({
        refreshed: 0,
        failures: [],
      });

      expect(logger.log).toHaveBeenCalledWith('缓存预取事件已广播', {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: [],
      });
    });

    it('应该正确处理各种载荷参数', async () => {
      const payload: CachePrefetchNotification = {
        domain: 'user-profile',
        tenantId: 'tenant-002',
        keys: [
          'user-profile:tenant-002:profile:user-123',
          'user-profile:tenant-002:profile:user-456',
        ],
        bypassLock: false,
      };

      const result = await service.publishPrefetchRequested(payload);

      expect(result).toEqual({
        refreshed: 2,
        failures: [],
      });

      expect(logger.log).toHaveBeenCalledWith('缓存预取事件已广播', {
        domain: 'user-profile',
        tenantId: 'tenant-002',
        keys: [
          'user-profile:tenant-002:profile:user-123',
          'user-profile:tenant-002:profile:user-456',
        ],
        bypassLock: false,
      });
    });

    it('应该返回符合 CachePrefetchResult 类型的结果', async () => {
      const payload: CachePrefetchNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['key1', 'key2'],
      };

      const result: CachePrefetchResult =
        await service.publishPrefetchRequested(payload);

      expect(result).toHaveProperty('refreshed');
      expect(result).toHaveProperty('failures');
      expect(Array.isArray(result.failures)).toBe(true);
      expect(typeof result.refreshed).toBe('number');
      expect(result.refreshed).toBe(2);
    });
  });

  describe('集成测试', () => {
    it('应该正确处理多个连续的发布操作', async () => {
      const invalidationPayload: CacheInvalidationNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['key1'],
        reason: '更新',
      };

      const lockPayload: CacheLockContentionNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['key1'],
        lockResource: 'lock:cache:tenant-config:tenant-001',
      };

      const prefetchPayload: CachePrefetchNotification = {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        keys: ['key1'],
      };

      await service.publishInvalidation(invalidationPayload);
      await service.publishLockContention(lockPayload);
      const result = await service.publishPrefetchRequested(prefetchPayload);

      expect(logger.log).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(result.refreshed).toBe(1);
    });
  });
});
