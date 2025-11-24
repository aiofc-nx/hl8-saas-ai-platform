import {
  GeneralBadRequestException,
  GeneralInternalServerException,
  MissingConfigurationForFeatureException,
  OptimisticLockException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ModuleRef } from '@nestjs/core';
import type { Redis } from 'ioredis';
import type Redlock from 'redlock';
import { CacheEvictionPolicy } from '../config/cache-namespace-policy.config.js';
import { CacheNamespaceRegistry } from '../config/cache-namespace.registry.js';
import { CacheClientProvider } from './cache-client.provider.js';
import { CacheConsistencyService } from './cache-consistency.service.js';
import { CacheNotificationService } from './cache-notification.service.js';
class MockResourceLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceLockedError';
  }
}

describe('CacheConsistencyService', () => {
  let service: CacheConsistencyService;
  const redisDel = jest.fn(async () => 1);
  const redisClient = { del: redisDel } as unknown as Redis;

  const cacheClientProvider = {
    getClient: jest.fn(() => redisClient),
  } as unknown as CacheClientProvider;

  const createPolicy = () => ({
    domain: 'tenant-config',
    keyPrefix: 'tc',
    keySuffix: null,
    separator: ':',
    defaultTTL: 300,
    evictionPolicy: CacheEvictionPolicy.DoubleDelete,
    hitThresholdAlert: null,
  });

  const registry = {
    get: jest.fn(() => createPolicy()),
  } as unknown as CacheNamespaceRegistry;

  const redlockUsing = jest.fn(
    async (
      _resources: string[],
      _duration: number,
      routine: (signal: {
        aborted: boolean;
        error?: Error;
      }) => Promise<unknown>,
    ) => routine({ aborted: false }),
  );
  const redlockService = {
    using: redlockUsing,
  } as unknown as Redlock;

  const childLoggerStub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  const loggerStub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    child: jest.fn().mockReturnValue(childLoggerStub),
  };
  const typedLoggerStub = loggerStub as unknown as Logger;

  const moduleRef = {
    get: jest.fn((token) => {
      // 如果传入的是 redlockService 类型，返回 mock 的 redlockService
      if (token === redlockService || typeof token === 'function') {
        return redlockService;
      }
      // 对于符号或字符串 token，也返回 redlockService
      return redlockService;
    }),
  } as unknown as ModuleRef;

  const notificationService = {
    publishInvalidation: jest.fn(async () => undefined),
    publishLockContention: jest.fn(async () => undefined),
    publishPrefetchRequested: jest.fn(async () => ({
      refreshed: 0,
      failures: [],
    })),
  } as unknown as CacheNotificationService;

  const resetStubs = () => {
    jest.clearAllMocks();
    (notificationService.publishInvalidation as jest.Mock).mockClear();
    (notificationService.publishLockContention as jest.Mock).mockClear();
    (notificationService.publishPrefetchRequested as jest.Mock).mockClear();
    redlockUsing.mockReset();
    redlockUsing.mockImplementation(async (_resources, _duration, routine) =>
      routine({ aborted: false }),
    );
    (cacheClientProvider.getClient as jest.Mock).mockReturnValue(redisClient);
    (moduleRef.get as jest.Mock).mockReturnValue(redlockService);
    (registry.get as jest.Mock).mockReset();
    (registry.get as jest.Mock).mockReturnValue(createPolicy());
  };

  beforeEach(() => {
    resetStubs();
    service = new CacheConsistencyService(
      cacheClientProvider,
      registry,
      typedLoggerStub,
      moduleRef,
      notificationService,
    );
  });

  it('should execute double delete within lock', async () => {
    await service.invalidate({
      domain: 'tenant-config',
      tenantId: 'tenant-1',
      keys: ['tenant-config:tenant-1:profile'],
      reason: '写路径更新',
      delayMs: 0,
    });

    expect(redlockUsing).toHaveBeenCalled();
    expect(notificationService.publishInvalidation).toHaveBeenCalledWith({
      domain: 'tenant-config',
      tenantId: 'tenant-1',
      keys: ['tenant-config:tenant-1:profile'],
      reason: '写路径更新',
    });
    expect(redisDel).toHaveBeenCalledTimes(2);
  });

  it('should validate required fields', async () => {
    await expect(
      service.invalidate({
        domain: '',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
      }),
    ).rejects.toBeInstanceOf(GeneralBadRequestException);

    await expect(
      service.invalidate({
        domain: 'tenant-config',
        tenantId: '',
        keys: ['k1'],
        reason: 'test',
      }),
    ).rejects.toBeInstanceOf(GeneralBadRequestException);

    await expect(
      service.invalidate({
        domain: 'tenant-config',
        tenantId: 'tenant-1',
        keys: [],
        reason: 'test',
      }),
    ).rejects.toBeInstanceOf(GeneralBadRequestException);
  });

  it('should throw when policy missing', async () => {
    (registry.get as jest.Mock).mockReturnValue(undefined);

    await expect(
      service.invalidate({
        domain: 'unknown',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
      }),
    ).rejects.toBeInstanceOf(MissingConfigurationForFeatureException);
  });

  it('should wrap unexpected errors', async () => {
    redlockUsing.mockRejectedValueOnce(new Error('lock failed'));

    await expect(
      service.invalidate({
        domain: 'tenant-config',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
      }),
    ).rejects.toBeInstanceOf(GeneralInternalServerException);
  });

  it('should propagate lock contention as conflict', async () => {
    redlockUsing.mockRejectedValueOnce(new MockResourceLockedError('busy'));

    await expect(
      service.invalidate({
        domain: 'tenant-config',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
      }),
    ).rejects.toThrow(OptimisticLockException);

    expect(notificationService.publishLockContention).toHaveBeenCalledWith({
      domain: 'tenant-config',
      tenantId: 'tenant-1',
      keys: ['k1'],
      lockResource: 'lock:cache:tenant-config:tenant-1',
    });
  });

  describe('错误处理和边界场景', () => {
    it('应该在 redlock 服务未注册时降级为内存锁', () => {
      const emptyModuleRef = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ModuleRef;

      const newService = new CacheConsistencyService(
        cacheClientProvider,
        registry,
        typedLoggerStub,
        emptyModuleRef,
        notificationService,
      );

      expect(childLoggerStub.warn).toHaveBeenCalledWith(
        '分布式锁服务未注册，已降级为内存锁实现',
      );
      expect(newService).toBeInstanceOf(CacheConsistencyService);
    });

    it('应该在 moduleRef 为 undefined 时降级为内存锁', () => {
      const newService = new CacheConsistencyService(
        cacheClientProvider,
        registry,
        typedLoggerStub,
        undefined,
        notificationService,
      );

      expect(childLoggerStub.warn).toHaveBeenCalledWith(
        '分布式锁服务未注册，已降级为内存锁实现',
      );
      expect(newService).toBeInstanceOf(CacheConsistencyService);
    });

    it('应该在 moduleRef.get 抛出异常时降级为内存锁', () => {
      const errorModuleRef = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('ModuleRef error');
        }),
      } as unknown as ModuleRef;

      const newService = new CacheConsistencyService(
        cacheClientProvider,
        registry,
        typedLoggerStub,
        errorModuleRef,
        notificationService,
      );

      expect(childLoggerStub.warn).toHaveBeenCalledWith(
        '分布式锁服务未注册，已降级为内存锁实现',
      );
      expect(newService).toBeInstanceOf(CacheConsistencyService);
    });

    it('应该在没有 notificationService 时正常工作', async () => {
      const serviceWithoutNotification = new CacheConsistencyService(
        cacheClientProvider,
        registry,
        typedLoggerStub,
        moduleRef,
        undefined,
      );

      await serviceWithoutNotification.invalidate({
        domain: 'tenant-config',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
        delayMs: 0,
      });

      expect(redisDel).toHaveBeenCalledTimes(2);
    });

    it('应该在获取 Redis 客户端失败时抛出异常', async () => {
      const errorProvider = {
        getClient: jest.fn().mockImplementation(() => {
          throw new Error('Redis client error');
        }),
      } as unknown as CacheClientProvider;

      const serviceWithErrorProvider = new CacheConsistencyService(
        errorProvider,
        registry,
        typedLoggerStub,
        moduleRef,
        notificationService,
      );

      await expect(
        serviceWithErrorProvider.invalidate({
          domain: 'tenant-config',
          tenantId: 'tenant-1',
          keys: ['k1'],
          reason: 'test',
        }),
      ).rejects.toThrow();
    });

    it('应该在 Redis del 操作失败时抛出异常', async () => {
      const failingRedisClient = {
        del: jest.fn(async () => {
          throw new Error('Redis del failed');
        }),
      } as unknown as Redis;

      const failingProvider = {
        getClient: jest.fn().mockReturnValue(failingRedisClient),
      } as unknown as CacheClientProvider;

      const serviceWithFailingRedis = new CacheConsistencyService(
        failingProvider,
        registry,
        typedLoggerStub,
        moduleRef,
        notificationService,
      );

      await expect(
        serviceWithFailingRedis.invalidate({
          domain: 'tenant-config',
          tenantId: 'tenant-1',
          keys: ['k1'],
          reason: 'test',
          delayMs: 0,
        }),
      ).rejects.toThrow();
    });

    it('应该支持自定义 lockDurationMs', async () => {
      await service.invalidate({
        domain: 'tenant-config',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
        lockDurationMs: 2000,
        delayMs: 0,
      });

      expect(redlockUsing).toHaveBeenCalledWith(
        expect.any(Array),
        2000,
        expect.any(Function),
      );
    });

    it('应该支持 notify 为 false 时不发送通知', async () => {
      await service.invalidate({
        domain: 'tenant-config',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
        notify: false,
        delayMs: 0,
      });

      expect(redisDel).toHaveBeenCalledTimes(2);
      expect(notificationService.publishInvalidation).not.toHaveBeenCalled();
    });

    it('应该支持自定义 clientKey', async () => {
      await service.invalidate({
        domain: 'tenant-config',
        tenantId: 'tenant-1',
        keys: ['k1'],
        reason: 'test',
        clientKey: 'custom-client',
        delayMs: 0,
      });

      expect(cacheClientProvider.getClient).toHaveBeenCalledWith(
        'custom-client',
      );
      expect(redisDel).toHaveBeenCalledTimes(2);
    });

    it('应该在延迟删除中处理错误', async () => {
      const delayedRedisDel = jest
        .fn(async () => 1)
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error('Delayed delete failed'));

      const delayedRedisClient = {
        del: delayedRedisDel,
      } as unknown as Redis;

      const delayedProvider = {
        getClient: jest.fn().mockReturnValue(delayedRedisClient),
      } as unknown as CacheClientProvider;

      const serviceWithDelayedError = new CacheConsistencyService(
        delayedProvider,
        registry,
        typedLoggerStub,
        moduleRef,
        notificationService,
      );

      await expect(
        serviceWithDelayedError.invalidate({
          domain: 'tenant-config',
          tenantId: 'tenant-1',
          keys: ['k1'],
          reason: 'test',
          delayMs: 10,
        }),
      ).rejects.toThrow();
    });

    it('应该正确构建锁资源键', async () => {
      await service.invalidate({
        domain: 'test-domain',
        tenantId: 'test-tenant',
        keys: ['key1', 'key2'],
        reason: 'test',
        delayMs: 0,
      });

      expect(redlockUsing).toHaveBeenCalledWith(
        expect.arrayContaining(['lock:cache:test-domain:test-tenant']),
        expect.any(Number),
        expect.any(Function),
      );
    });
  });
});
