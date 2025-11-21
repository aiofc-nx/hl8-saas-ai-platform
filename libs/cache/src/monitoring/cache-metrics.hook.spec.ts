import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type {
  CacheLogger,
  CacheLoggerWithChild,
} from '../types/logger.types.js';
import { CacheMetricsHook } from './cache-metrics.hook.js';

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

describe('CacheMetricsHook', () => {
  let logger: CacheLogger;
  let hook: CacheMetricsHook;

  beforeEach(() => {
    logger = createLoggerWithChildStub();
    hook = new CacheMetricsHook(logger);
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该在 logger 有 child 方法时创建子日志器', () => {
      const loggerWithChild = createLoggerWithChildStub();
      const childSpy = jest.spyOn(loggerWithChild as any, 'child');

      const newHook = new CacheMetricsHook(loggerWithChild);

      expect(childSpy).toHaveBeenCalledWith({
        context: CacheMetricsHook.name,
      });
    });

    it('应该在 logger 没有 child 方法时直接使用原日志器', () => {
      const loggerWithoutChild = createLoggerWithoutChildStub();

      const newHook = new CacheMetricsHook(loggerWithoutChild);

      expect(newHook).toBeInstanceOf(CacheMetricsHook);
    });

    it('应该在 logger.child 为 undefined 时使用原日志器', () => {
      const loggerStub = createLoggerStub();
      (loggerStub as any).child = undefined;

      const newHook = new CacheMetricsHook(loggerStub);

      expect(newHook).toBeInstanceOf(CacheMetricsHook);
    });
  });

  describe('recordHit', () => {
    it('应该记录缓存命中事件', () => {
      hook.recordHit({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        extra: { key: 'test-key' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'hit',
          value: 1,
          extra: { key: 'test-key' },
        },
      });
    });

    it('应该支持不带 tenantId 的记录', () => {
      hook.recordHit({
        domain: 'tenant-config',
        extra: { key: 'test-key' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          metric: 'hit',
          value: 1,
          extra: { key: 'test-key' },
        },
      });
    });

    it('应该支持不带 extra 的记录', () => {
      hook.recordHit({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'hit',
          value: 1,
        },
      });
    });

    it('应该自动设置 metric 为 hit 和 value 为 1', () => {
      hook.recordHit({
        domain: 'tenant-config',
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: expect.objectContaining({
          metric: 'hit',
          value: 1,
        }),
      });
    });
  });

  describe('recordMiss', () => {
    it('应该记录缓存未命中事件', () => {
      hook.recordMiss({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        extra: { key: 'test-key' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'miss',
          value: 1,
          extra: { key: 'test-key' },
        },
      });
    });

    it('应该支持不带 tenantId 的记录', () => {
      hook.recordMiss({
        domain: 'tenant-config',
        extra: { key: 'test-key' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          metric: 'miss',
          value: 1,
          extra: { key: 'test-key' },
        },
      });
    });

    it('应该自动设置 metric 为 miss 和 value 为 1', () => {
      hook.recordMiss({
        domain: 'tenant-config',
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: expect.objectContaining({
          metric: 'miss',
          value: 1,
        }),
      });
    });
  });

  describe('recordOriginLatency', () => {
    it('应该记录回源耗时指标', () => {
      hook.recordOriginLatency({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        value: 150.5,
        extra: { key: 'test-key' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'origin',
          value: 150.5,
          extra: { key: 'test-key' },
        },
      });
    });

    it('应该支持不带 tenantId 的记录', () => {
      hook.recordOriginLatency({
        domain: 'tenant-config',
        value: 200,
        extra: { key: 'test-key' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          metric: 'origin',
          value: 200,
          extra: { key: 'test-key' },
        },
      });
    });

    it('应该支持不带 extra 的记录', () => {
      hook.recordOriginLatency({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        value: 100,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'origin',
          value: 100,
        },
      });
    });

    it('应该自动设置 metric 为 origin', () => {
      hook.recordOriginLatency({
        domain: 'tenant-config',
        value: 50,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: expect.objectContaining({
          metric: 'origin',
          value: 50,
        }),
      });
    });

    it('应该支持零值耗时', () => {
      hook.recordOriginLatency({
        domain: 'tenant-config',
        value: 0,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: expect.objectContaining({
          metric: 'origin',
          value: 0,
        }),
      });
    });
  });

  describe('recordLockWait', () => {
    it('应该记录锁等待耗时指标', () => {
      hook.recordLockWait({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        value: 25.3,
        extra: { lockResource: 'lock:cache:tenant-config:tenant-001' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'lock',
          value: 25.3,
          extra: { lockResource: 'lock:cache:tenant-config:tenant-001' },
        },
      });
    });

    it('应该支持不带 tenantId 的记录', () => {
      hook.recordLockWait({
        domain: 'tenant-config',
        value: 30,
        extra: { lockResource: 'lock:cache:tenant-config' },
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          metric: 'lock',
          value: 30,
          extra: { lockResource: 'lock:cache:tenant-config' },
        },
      });
    });

    it('应该自动设置 metric 为 lock', () => {
      hook.recordLockWait({
        domain: 'tenant-config',
        value: 10,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: expect.objectContaining({
          metric: 'lock',
          value: 10,
        }),
      });
    });
  });

  describe('recordFailure', () => {
    it('应该记录缓存操作失败事件', () => {
      const error = new Error('Redis connection failed');
      hook.recordFailure({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        extra: { key: 'test-key', stage: 'read' },
        error,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'failure',
          value: 1,
          extra: { key: 'test-key', stage: 'read' },
          error,
        },
      });

      expect(logger.error).toHaveBeenCalledWith('缓存操作失败', undefined, {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        extra: { key: 'test-key', stage: 'read' },
        error,
      });
    });

    it('应该支持不带 tenantId 的记录', () => {
      const error = new Error('Serialization failed');
      hook.recordFailure({
        domain: 'tenant-config',
        extra: { key: 'test-key', stage: 'serialize' },
        error,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          metric: 'failure',
          value: 1,
          extra: { key: 'test-key', stage: 'serialize' },
          error,
        },
      });

      expect(logger.error).toHaveBeenCalledWith('缓存操作失败', undefined, {
        domain: 'tenant-config',
        extra: { key: 'test-key', stage: 'serialize' },
        error,
      });
    });

    it('应该支持不带 extra 的记录', () => {
      const error = new Error('Unknown error');
      hook.recordFailure({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        error,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: {
          domain: 'tenant-config',
          tenantId: 'tenant-001',
          metric: 'failure',
          value: 1,
          error,
        },
      });

      expect(logger.error).toHaveBeenCalledWith('缓存操作失败', undefined, {
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        error,
      });
    });

    it('应该自动设置 metric 为 failure 和 value 为 1', () => {
      const error = new Error('Test error');
      hook.recordFailure({
        domain: 'tenant-config',
        error,
      });

      expect(logger.debug).toHaveBeenCalledWith('缓存指标上报', {
        payload: expect.objectContaining({
          metric: 'failure',
          value: 1,
          error,
        }),
      });
    });

    it('应该同时记录指标和错误日志', () => {
      const error = new Error('Test error');
      hook.recordFailure({
        domain: 'tenant-config',
        error,
      });

      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('应该支持各种错误类型', () => {
      const stringError = 'String error';
      hook.recordFailure({
        domain: 'tenant-config',
        error: stringError,
      });

      expect(logger.error).toHaveBeenCalledWith(
        '缓存操作失败',
        undefined,
        expect.objectContaining({
          error: stringError,
        }),
      );

      const objectError = {
        code: 'ERR_CONNECTION',
        message: 'Connection failed',
      };
      hook.recordFailure({
        domain: 'tenant-config',
        error: objectError,
      });

      expect(logger.error).toHaveBeenCalledWith(
        '缓存操作失败',
        undefined,
        expect.objectContaining({
          error: objectError,
        }),
      );
    });
  });

  describe('私有方法 record（通过公共方法间接测试）', () => {
    it('应该通过 recordHit 调用私有 record 方法', () => {
      hook.recordHit({
        domain: 'tenant-config',
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '缓存指标上报',
        expect.objectContaining({
          payload: expect.objectContaining({
            domain: 'tenant-config',
          }),
        }),
      );
    });

    it('应该通过 recordMiss 调用私有 record 方法', () => {
      hook.recordMiss({
        domain: 'tenant-config',
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '缓存指标上报',
        expect.objectContaining({
          payload: expect.objectContaining({
            domain: 'tenant-config',
          }),
        }),
      );
    });

    it('应该通过 recordOriginLatency 调用私有 record 方法', () => {
      hook.recordOriginLatency({
        domain: 'tenant-config',
        value: 100,
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '缓存指标上报',
        expect.objectContaining({
          payload: expect.objectContaining({
            domain: 'tenant-config',
          }),
        }),
      );
    });

    it('应该通过 recordLockWait 调用私有 record 方法', () => {
      hook.recordLockWait({
        domain: 'tenant-config',
        value: 50,
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '缓存指标上报',
        expect.objectContaining({
          payload: expect.objectContaining({
            domain: 'tenant-config',
          }),
        }),
      );
    });

    it('应该通过 recordFailure 调用私有 record 方法', () => {
      hook.recordFailure({
        domain: 'tenant-config',
        error: new Error('Test'),
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '缓存指标上报',
        expect.objectContaining({
          payload: expect.objectContaining({
            domain: 'tenant-config',
          }),
        }),
      );
    });
  });

  describe('集成测试', () => {
    it('应该正确处理多个连续的指标记录操作', () => {
      hook.recordHit({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
      });

      hook.recordMiss({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
      });

      hook.recordOriginLatency({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        value: 100,
      });

      hook.recordLockWait({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        value: 20,
      });

      hook.recordFailure({
        domain: 'tenant-config',
        tenantId: 'tenant-001',
        error: new Error('Test error'),
      });

      expect(logger.debug).toHaveBeenCalledTimes(5);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('应该支持不同业务域的指标记录', () => {
      hook.recordHit({
        domain: 'tenant-config',
      });

      hook.recordHit({
        domain: 'user-profile',
      });

      hook.recordHit({
        domain: 'feature-flags',
      });

      expect(logger.debug).toHaveBeenCalledTimes(3);
      const calls = (logger.debug as jest.Mock).mock.calls;
      expect(calls[0][1].payload.domain).toBe('tenant-config');
      expect(calls[1][1].payload.domain).toBe('user-profile');
      expect(calls[2][1].payload.domain).toBe('feature-flags');
    });
  });
});
