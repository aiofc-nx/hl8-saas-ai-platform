import {
  GeneralBadRequestException,
  GeneralInternalServerException,
} from '@hl8/exceptions';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CacheMetricsHook } from '../monitoring/cache-metrics.hook.js';
import { CacheClientProvider } from './cache-client.provider.js';
import {
  CacheReadService,
  type CacheReadOptions,
} from './cache-read.service.js';

const createLoggerStub = () =>
  ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    child: jest.fn().mockReturnThis(),
  }) as const;

describe('CacheReadService', () => {
  let cacheClientProvider: CacheClientProvider;
  let cacheMetricsHook: CacheMetricsHook;
  let service: CacheReadService;
  let redisClient: any;
  let logger: ReturnType<typeof createLoggerStub>;

  beforeEach(() => {
    redisClient = {
      get: jest.fn(async () => null),
      set: jest.fn(async () => 'OK'),
    };

    cacheClientProvider = {
      getClient: jest.fn().mockReturnValue(redisClient),
    } as unknown as CacheClientProvider;

    cacheMetricsHook = {
      recordHit: jest.fn(),
      recordMiss: jest.fn(),
      recordOriginLatency: jest.fn(),
      recordLockWait: jest.fn(),
      recordFailure: jest.fn(),
    } as unknown as CacheMetricsHook;

    logger = createLoggerStub();

    service = new CacheReadService(
      cacheClientProvider,
      cacheMetricsHook,
      logger as unknown as any,
    );
  });

  const createOptions = <T>(override: Partial<CacheReadOptions<T>> = {}) => {
    const defaultLoader = async (): Promise<T> => {
      return {} as T;
    };
    return {
      domain: 'tenant-config',
      key: 'tenant-config:tenant-001:config',
      loader: defaultLoader,
      ...override,
    };
  };

  it('should return cached value when redis hit', async () => {
    redisClient.get.mockResolvedValueOnce(JSON.stringify({ cached: true }));
    const loader = jest.fn(async () => ({ cached: false }));
    const options = {
      ...createOptions<{ cached: boolean }>(),
      loader: loader as unknown as () => Promise<{ cached: boolean }>,
    };

    const result = await service.getOrLoad(options);

    expect(result).toEqual({ cached: true });
    expect(options.loader).not.toHaveBeenCalled();
    expect(cacheMetricsHook.recordHit).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'tenant-config',
        extra: { key: options.key },
      }),
    );
  });

  it('should call loader and persist value when cache miss', async () => {
    redisClient.get.mockResolvedValueOnce(null);
    const loader = jest.fn(async () => ({ config: 'data' }));
    const options = {
      ...createOptions<{ config: string }>(),
      loader: loader as unknown as () => Promise<{ config: string }>,
      ttlSeconds: 120,
    };

    const result = await service.getOrLoad(options);

    expect(result).toEqual({ config: 'data' });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      options.key,
      JSON.stringify({ config: 'data' }),
      'EX',
      120,
    );
    expect(cacheMetricsHook.recordMiss).toHaveBeenCalled();
    expect(cacheMetricsHook.recordOriginLatency).toHaveBeenCalled();
  });

  it('should propagate loader errors', async () => {
    redisClient.get.mockResolvedValueOnce(null);
    const error = new Error('loader failed');
    const loader = jest.fn(async () => {
      throw error;
    });
    const options = {
      ...createOptions<{ value: number }>(),
      loader: loader as unknown as () => Promise<{ value: number }>,
    };

    await expect(service.getOrLoad(options)).rejects.toThrow(error);
  });

  it('should wrap redis failures into internal exception', async () => {
    redisClient.get.mockRejectedValueOnce(new Error('redis down'));
    const options = createOptions();

    await expect(service.getOrLoad(options)).rejects.toThrow(
      GeneralInternalServerException,
    );
    expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        extra: { key: options.key, stage: 'unknown' },
      }),
    );
  });

  describe('边缘场景和错误处理', () => {
    it('应该在反序列化失败时抛出 GeneralInternalServerException', async () => {
      const invalidJson = 'invalid json{';
      redisClient.get.mockResolvedValueOnce(invalidJson);
      const options = createOptions<{ data: string }>();

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralInternalServerException,
      );

      expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: { key: options.key, stage: 'deserialize' },
        }),
      );
    });

    it('应该在反序列化失败时记录错误指标', async () => {
      const invalidJson = 'not valid json';
      redisClient.get.mockResolvedValueOnce(invalidJson);
      const options = createOptions<{ data: string }>();

      await expect(service.getOrLoad(options)).rejects.toThrow();

      expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'tenant-config',
          extra: { key: options.key, stage: 'deserialize' },
          error: expect.any(Error),
        }),
      );
    });

    it('应该在序列化失败时抛出 GeneralInternalServerException', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const circularObject: any = { data: 'test' };
      circularObject.self = circularObject;
      const failingSerialize = jest.fn(() => {
        throw new Error('Serialization failed');
      });
      const options = {
        ...createOptions<any>(),
        loader: jest.fn(async () => circularObject),
        serialize: failingSerialize,
      };

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralInternalServerException,
      );

      expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: { key: options.key, stage: 'persist' },
        }),
      );
    });

    it('应该在 Redis set 失败时抛出异常', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      redisClient.set.mockRejectedValueOnce(new Error('Redis set failed'));
      const options = createOptions<{ data: string }>({
        loader: jest.fn(async () => ({ data: 'test' })),
      });

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralInternalServerException,
      );

      expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: { key: options.key, stage: 'persist' },
        }),
      );
    });

    it('应该在持久化时记录错误指标', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      redisClient.set.mockRejectedValueOnce(new Error('Redis connection lost'));
      const options = createOptions<{ data: string }>({
        loader: jest.fn(async () => ({ data: 'test' })),
      });

      await expect(service.getOrLoad(options)).rejects.toThrow();

      expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'tenant-config',
          extra: { key: options.key, stage: 'persist' },
          error: expect.any(Error),
        }),
      );
    });

    it('应该在 loader 不是函数时抛出 GeneralBadRequestException', async () => {
      const options = {
        ...createOptions(),
        loader: 'not a function' as unknown as () => Promise<unknown>,
      };

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该在 key 为空字符串时抛出 GeneralBadRequestException', async () => {
      const options = createOptions({
        key: '',
      });

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该在 key 为空白字符串时抛出 GeneralBadRequestException', async () => {
      const options = createOptions({
        key: '   ',
      });

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该在 domain 为空时抛出 GeneralBadRequestException', async () => {
      const options = createOptions({
        domain: '',
      });

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该在 getClient 失败时抛出 GeneralInternalServerException', async () => {
      const errorProvider = {
        getClient: jest.fn().mockImplementation(() => {
          throw new Error('Client initialization failed');
        }),
      } as unknown as CacheClientProvider;

      const serviceWithErrorProvider = new CacheReadService(
        errorProvider,
        cacheMetricsHook,
        logger as unknown as any,
      );

      const options = createOptions();

      await expect(serviceWithErrorProvider.getOrLoad(options)).rejects.toThrow(
        GeneralInternalServerException,
      );
    });

    it('应该支持不带 TTL 的持久化', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const options = createOptions<{ data: string }>({
        loader: jest.fn(async () => ({ data: 'test' })),
        ttlSeconds: undefined,
      });

      await service.getOrLoad(options);

      expect(redisClient.set).toHaveBeenCalledWith(
        options.key,
        JSON.stringify({ data: 'test' }),
      );
    });

    it('应该支持 TTL 为 0 时的不设置过期', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const options = createOptions<{ data: string }>({
        loader: jest.fn(async () => ({ data: 'test' })),
        ttlSeconds: 0,
      });

      await service.getOrLoad(options);

      expect(redisClient.set).toHaveBeenCalledWith(
        options.key,
        JSON.stringify({ data: 'test' }),
      );
    });

    it('应该在 loader 抛出非 Error 对象时正确包装错误', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const options = createOptions<{ data: string }>({
        loader: jest.fn(async () => {
          throw 'String error';
        }),
      });

      await expect(service.getOrLoad(options)).rejects.toBeDefined();

      expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: { key: options.key, stage: 'loader' },
        }),
      );
    });

    it('应该在 loader 抛出错误时保留 __cacheLoaderError 标记', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const error = new Error('Loader failed');
      const options = createOptions<{ data: string }>({
        loader: jest.fn(async () => {
          throw error;
        }),
      });

      try {
        await service.getOrLoad(options);
      } catch (thrownError) {
        expect((thrownError as any).__cacheLoaderError).toBe(true);
      }
    });

    it('应该支持自定义序列化/反序列化函数', async () => {
      redisClient.get.mockResolvedValueOnce('base64:encoded:data');
      const customSerialize = jest.fn(
        (value: { data: string }) => `base64:${value.data}`,
      );
      const customDeserialize = jest.fn((payload: string) => ({
        data: payload.replace('base64:', ''),
      }));
      const options = {
        ...createOptions<{ data: string }>(),
        serialize: customSerialize,
        deserialize: customDeserialize,
      };

      const result = await service.getOrLoad(options);

      expect(result).toEqual({ data: 'encoded:data' });
      expect(customDeserialize).toHaveBeenCalledWith('base64:encoded:data');
    });

    it('应该在自定义反序列化失败时抛出异常', async () => {
      redisClient.get.mockResolvedValueOnce('some-data');
      const failingDeserialize = jest.fn(() => {
        throw new Error('Custom deserialization failed');
      });
      const options = {
        ...createOptions<{ data: string }>(),
        deserialize: failingDeserialize,
      };

      await expect(service.getOrLoad(options)).rejects.toThrow(
        GeneralInternalServerException,
      );

      expect(cacheMetricsHook.recordFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: { key: options.key, stage: 'deserialize' },
        }),
      );
    });

    it('应该支持自定义 clientKey', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const options = createOptions<{ data: string }>({
        loader: jest.fn(async () => ({ data: 'test' })),
        clientKey: 'custom-client',
      });

      await service.getOrLoad(options);

      expect(cacheClientProvider.getClient).toHaveBeenCalledWith(
        'custom-client',
      );
    });

    it('应该支持自定义 tenantId', async () => {
      redisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));
      const options = createOptions<{ data: string }>({
        tenantId: 'custom-tenant',
      });

      await service.getOrLoad(options);

      expect(cacheMetricsHook.recordHit).toHaveBeenCalledWith({
        domain: 'tenant-config',
        tenantId: 'custom-tenant',
        extra: { key: options.key },
      });
    });
  });
});
