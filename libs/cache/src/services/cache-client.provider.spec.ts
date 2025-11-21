import {
  GeneralInternalServerException,
  MissingConfigurationForFeatureException,
} from '@hl8/exceptions';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { RedisClients } from '@liaoliaots/nestjs-redis/dist/redis/interfaces/index.js';
import type { Redis } from 'ioredis';
import { CacheConfig } from '../config/cache.config.js';
import { RedisClientConfig } from '../config/redis-client.config.js';
import type {
  CacheLogger,
  CacheLoggerWithChild,
} from '../types/logger.types.js';
import { CacheClientProvider } from './cache-client.provider.js';

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

/**
 * @description 创建 Redis 客户端 Mock
 */
const createRedisClientMock = (): Redis => {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  } as unknown as Redis;
};

describe('CacheClientProvider', () => {
  let redisClients: RedisClients;
  let cacheConfig: CacheConfig;
  let logger: CacheLogger;
  let provider: CacheClientProvider;
  let redisClient1: Redis;
  let redisClient2: Redis;

  beforeEach(() => {
    redisClient1 = createRedisClientMock();
    redisClient2 = createRedisClientMock();
    redisClients = new Map([
      ['client1', redisClient1],
      ['client2', redisClient2],
    ]);

    cacheConfig = new CacheConfig();
    cacheConfig.defaultClientKey = 'client1';
    cacheConfig.clients = [
      {
        clientKey: 'client1',
        namespace: 'ns1',
      } as RedisClientConfig,
      {
        clientKey: 'client2',
        namespace: 'ns2',
      } as RedisClientConfig,
    ];

    logger = createLoggerWithChildStub();
  });

  describe('构造函数', () => {
    it('应该使用注入的 redisClients 和 cacheConfig', () => {
      provider = new CacheClientProvider(redisClients, cacheConfig, logger);

      const client = provider.getClient('client1');
      expect(client).toBe(redisClient1);
    });

    it('应该在 redisClients 未注入时创建内存 fallback 客户端', () => {
      const warnSpy = jest.spyOn(logger as any, 'warn');

      provider = new CacheClientProvider(undefined, cacheConfig, logger);

      expect(warnSpy).toHaveBeenCalledWith(
        '未注入 Redis 客户端令牌，使用内存缓存映射作为占位',
        { domain: 'tenant-config' },
      );

      const fallbackClient = provider.getClient();
      expect(fallbackClient).toBeDefined();
      expect(typeof fallbackClient.get).toBe('function');
      expect(typeof fallbackClient.set).toBe('function');
      expect(typeof fallbackClient.del).toBe('function');
    });

    it('应该在 cacheConfig 未注入时使用默认配置', () => {
      provider = new CacheClientProvider(redisClients, undefined, logger);

      const client = provider.getClient('client1');
      expect(client).toBe(redisClient1);
    });

    it('应该在 logger 有 child 方法时创建子日志器', () => {
      const loggerWithChild = createLoggerWithChildStub();
      const childSpy = jest.spyOn(loggerWithChild as any, 'child');

      provider = new CacheClientProvider(
        redisClients,
        cacheConfig,
        loggerWithChild,
      );

      expect(childSpy).toHaveBeenCalledWith({
        context: CacheClientProvider.name,
      });
    });

    it('应该在 logger 没有 child 方法时直接使用原日志器', () => {
      const loggerWithoutChild = createLoggerWithoutChildStub();

      provider = new CacheClientProvider(
        redisClients,
        cacheConfig,
        loggerWithoutChild,
      );

      const client = provider.getClient('client1');
      expect(client).toBe(redisClient1);
    });

    it('应该在 logger.child 为 undefined 时使用原日志器', () => {
      const loggerStub = createLoggerStub();
      (loggerStub as any).child = undefined;

      provider = new CacheClientProvider(redisClients, cacheConfig, loggerStub);

      const client = provider.getClient('client1');
      expect(client).toBe(redisClient1);
    });

    it('应该在创建 fallback 客户端时使用配置的 defaultClientKey', () => {
      cacheConfig.defaultClientKey = 'custom-key';

      provider = new CacheClientProvider(undefined, cacheConfig, logger);

      const fallbackClient = provider.getClient('custom-key');
      expect(fallbackClient).toBeDefined();
    });

    it('应该在创建 fallback 客户端时使用 clients[0].clientKey', () => {
      cacheConfig.defaultClientKey = undefined;
      cacheConfig.clients = [
        {
          clientKey: 'first-client',
        } as RedisClientConfig,
      ];

      provider = new CacheClientProvider(undefined, cacheConfig, logger);

      const fallbackClient = provider.getClient('first-client');
      expect(fallbackClient).toBeDefined();
    });

    it('应该在创建 fallback 客户端时使用 clients[0].namespace', () => {
      cacheConfig.defaultClientKey = undefined;
      cacheConfig.clients = [
        {
          namespace: 'first-namespace',
        } as RedisClientConfig,
      ];

      provider = new CacheClientProvider(undefined, cacheConfig, logger);

      const fallbackClient = provider.getClient('first-namespace');
      expect(fallbackClient).toBeDefined();
    });

    it('应该在所有配置都缺失时使用 default 作为 fallback key', () => {
      cacheConfig.defaultClientKey = undefined;
      cacheConfig.clients = [];

      provider = new CacheClientProvider(undefined, cacheConfig, logger);

      const fallbackClient = provider.getClient('default');
      expect(fallbackClient).toBeDefined();
    });
  });

  describe('getClient', () => {
    beforeEach(() => {
      provider = new CacheClientProvider(redisClients, cacheConfig, logger);
    });

    it('应该使用指定的 clientKey 获取客户端', () => {
      const client = provider.getClient('client1');
      expect(client).toBe(redisClient1);

      const client2 = provider.getClient('client2');
      expect(client2).toBe(redisClient2);
    });

    it('应该在未指定 clientKey 时使用默认客户端', () => {
      const client = provider.getClient();
      expect(client).toBe(redisClient1);
    });

    it('应该在客户端不存在时抛出 MissingConfigurationForFeatureException', () => {
      const errorSpy = jest.spyOn(logger as any, 'error');

      expect(() => provider.getClient('non-existent')).toThrow(
        MissingConfigurationForFeatureException,
      );

      expect(errorSpy).toHaveBeenCalledWith('缓存客户端获取失败', undefined, {
        clientKey: 'non-existent',
      });
    });

    it('应该在获取客户端过程中发生未知异常时包装为 GeneralInternalServerException', () => {
      const errorClients = new Map();
      const errorGet = jest.spyOn(errorClients, 'get');
      errorGet.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      provider = new CacheClientProvider(errorClients, cacheConfig, logger);

      const errorSpy = jest.spyOn(logger as any, 'error');

      expect(() => provider.getClient('client1')).toThrow(
        GeneralInternalServerException,
      );

      expect(errorSpy).toHaveBeenCalledWith(
        '获取 Redis 客户端实例时发生异常',
        undefined,
        expect.objectContaining({
          clientKey: 'client1',
          error: expect.any(Error),
        }),
      );
    });

    it('应该在抛出 MissingConfigurationForFeatureException 时不再包装', () => {
      const errorClients = new Map();
      const errorGet = jest.spyOn(errorClients, 'get');
      errorGet.mockImplementation(() => {
        throw new MissingConfigurationForFeatureException(
          '缓存客户端',
          'test',
          'test message',
        );
      });

      provider = new CacheClientProvider(errorClients, cacheConfig, logger);

      expect(() => provider.getClient('client1')).toThrow(
        MissingConfigurationForFeatureException,
      );
    });
  });

  describe('getNamespacePrefix', () => {
    beforeEach(() => {
      provider = new CacheClientProvider(redisClients, cacheConfig, logger);
    });

    it('应该返回指定 clientKey 对应的命名空间前缀', () => {
      const prefix = provider.getNamespacePrefix('client1');
      expect(prefix).toBe('ns1');

      const prefix2 = provider.getNamespacePrefix('client2');
      expect(prefix2).toBe('ns2');
    });

    it('应该在未指定 clientKey 时返回默认客户端的命名空间前缀', () => {
      const prefix = provider.getNamespacePrefix();
      expect(prefix).toBe('ns1');
    });

    it('应该在配置不存在时返回 undefined', () => {
      const prefix = provider.getNamespacePrefix('non-existent');
      expect(prefix).toBeUndefined();
    });

    it('应该使用 namespace 作为 key 查找配置', () => {
      cacheConfig.clients = [
        {
          namespace: 'namespace-only',
        } as RedisClientConfig,
      ];

      provider = new CacheClientProvider(redisClients, cacheConfig, logger);

      const prefix = provider.getNamespacePrefix('namespace-only');
      expect(prefix).toBe('namespace-only');
    });
  });

  describe('resolveTargetClientKey（通过公共方法间接测试）', () => {
    beforeEach(() => {
      provider = new CacheClientProvider(redisClients, cacheConfig, logger);
    });

    it('应该使用指定的 clientKey', () => {
      const client = provider.getClient('client2');
      expect(client).toBe(redisClient2);
    });

    it('应该使用配置的 defaultClientKey', () => {
      cacheConfig.defaultClientKey = 'client2';

      provider = new CacheClientProvider(redisClients, cacheConfig, logger);

      const client = provider.getClient();
      expect(client).toBe(redisClient2);
    });

    it('应该在 defaultClientKey 未配置时使用第一个客户端', () => {
      cacheConfig.defaultClientKey = undefined;

      provider = new CacheClientProvider(redisClients, cacheConfig, logger);

      const client = provider.getClient();
      expect(client).toBe(redisClient1);
    });

    it('应该在 clientKey 为空字符串时使用默认逻辑', () => {
      const client = provider.getClient('');
      expect(client).toBe(redisClient1);
    });

    it('应该在 clientKey 为空白字符串时使用默认逻辑', () => {
      const client = provider.getClient('   ');
      expect(client).toBe(redisClient1);
    });

    it('应该在所有客户端都不存在时抛出异常', () => {
      const emptyClients = new Map();

      provider = new CacheClientProvider(emptyClients, cacheConfig, logger);

      expect(() => provider.getClient()).toThrow(
        MissingConfigurationForFeatureException,
      );
    });
  });

  describe('createFallbackRedisClient（通过公共方法间接测试）', () => {
    beforeEach(() => {
      provider = new CacheClientProvider(undefined, cacheConfig, logger);
    });

    it('应该支持基本的 get/set 操作', async () => {
      const client = provider.getClient();

      await client.set('test-key', 'test-value');
      const value = await client.get('test-key');

      expect(value).toBe('test-value');
    });

    it('应该支持 TTL 过期功能', async () => {
      jest.useFakeTimers();
      const client = provider.getClient();

      await client.set('ttl-key', 'ttl-value', 'EX', 1);

      const value1 = await client.get('ttl-key');
      expect(value1).toBe('ttl-value');

      jest.advanceTimersByTime(1000);

      const value2 = await client.get('ttl-key');
      expect(value2).toBeNull();

      jest.useRealTimers();
    });

    it('应该在设置新值时清除旧的 TTL', async () => {
      jest.useFakeTimers();
      const client = provider.getClient();

      await client.set('ttl-key', 'value1', 'EX', 1);

      jest.advanceTimersByTime(500);

      await client.set('ttl-key', 'value2', 'EX', 2);

      jest.advanceTimersByTime(1000);

      const value = await client.get('ttl-key');
      expect(value).toBe('value2');

      jest.useRealTimers();
    });

    it('应该支持 del 操作', async () => {
      const client = provider.getClient();

      await client.set('key1', 'value1');
      await client.set('key2', 'value2');

      const deleted = await client.del('key1');

      expect(deleted).toBe(1);
      expect(await client.get('key1')).toBeNull();
      expect(await client.get('key2')).toBe('value2');
    });

    it('应该支持批量 del 操作', async () => {
      const client = provider.getClient();

      await client.set('key1', 'value1');
      await client.set('key2', 'value2');
      await client.set('key3', 'value3');

      const deleted = await client.del('key1', 'key2', 'key3');

      expect(deleted).toBe(3);
      expect(await client.get('key1')).toBeNull();
      expect(await client.get('key2')).toBeNull();
      expect(await client.get('key3')).toBeNull();
    });

    it('应该在 del 时清除 TTL', async () => {
      jest.useFakeTimers();
      const client = provider.getClient();

      await client.set('ttl-key', 'ttl-value', 'EX', 10);

      await client.del('ttl-key');

      jest.advanceTimersByTime(20000);

      const value = await client.get('ttl-key');
      expect(value).toBeNull();

      jest.useRealTimers();
    });

    it('应该支持 Buffer 类型的 key', async () => {
      const client = provider.getClient();

      const keyBuffer = Buffer.from('buffer-key', 'utf-8');
      await client.set(keyBuffer as unknown as string, 'buffer-value');

      const value = await client.get(keyBuffer as unknown as string);
      expect(value).toBe('buffer-value');
    });

    it('应该支持带回调的 del 操作', (done) => {
      const client = provider.getClient();

      client.set('callback-key', 'callback-value').then(() => {
        client.del('callback-key', (err, result) => {
          expect(err).toBeNull();
          expect(result).toBe(1);
          done();
        });
      });
    });

    it('应该在 get 不存在的 key 时返回 null', async () => {
      const client = provider.getClient();

      const value = await client.get('non-existent');
      expect(value).toBeNull();
    });

    it('应该只接受 EX 模式的 TTL', async () => {
      const client = provider.getClient();

      await client.set('key', 'value', 'PX', 1000);
      const value = await client.get('key');
      expect(value).toBe('value');

      // 验证 TTL 未被应用（因为我们只支持 EX）
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const valueAfter = await client.get('key');
      expect(valueAfter).toBe('value');
    });

    it('应该在 TTL 小于等于 0 时不设置过期', async () => {
      const client = provider.getClient();

      await client.set('key', 'value', 'EX', 0);
      const value = await client.get('key');
      expect(value).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 100));
      const valueAfter = await client.get('key');
      expect(valueAfter).toBe('value');
    });
  });
});
