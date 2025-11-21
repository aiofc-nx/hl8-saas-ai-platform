import { GeneralBadRequestException } from '@hl8/exceptions';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { CacheLogger } from '../types/logger.types.js';
import { AbstractCacheKeyBuilder } from './abstract-key.builder.js';
import {
  TenantConfigKeyBuilder,
  type TenantConfigKeyPayload,
} from './tenant-config-key.builder.js';

type LoggerStub = {
  log: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
  verbose: jest.Mock;
  child: jest.Mock;
};

const createLoggerStub = (): LoggerStub => {
  const stub: LoggerStub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    child: jest.fn(),
  } as unknown as LoggerStub;
  stub.child.mockReturnValue(stub);
  return stub;
};

describe('TenantConfigKeyBuilder', () => {
  let builder: TenantConfigKeyBuilder;
  let logger: LoggerStub;

  beforeEach(() => {
    logger = createLoggerStub();
    builder = new TenantConfigKeyBuilder(logger as unknown as any);
  });

  it('should build default key structure', () => {
    const payload: TenantConfigKeyPayload = {
      tenantId: 'tenant-001',
    };

    const key = builder.build(payload);

    expect(key).toBe('tenant-config:tenant-001:config');
  });

  it('should include config key and variant, trimming extra spaces', () => {
    const payload: TenantConfigKeyPayload = {
      tenantId: ' tenant-002 ',
      configKey: 'profile beta',
      variant: ' 2025 ',
    };

    const key = builder.build(payload);

    expect(key).toBe('tenant-config:tenant-002:profilebeta:2025');
    expect(logger.warn).toHaveBeenCalledWith(
      '缓存键片段包含空格，已自动去除空白',
      expect.objectContaining({ segment: 'profile beta' }),
    );
  });

  it('should throw when tenant id is empty', () => {
    const payload: TenantConfigKeyPayload = {
      tenantId: '   ',
    };

    expect(() => builder.build(payload)).toThrow(GeneralBadRequestException);
  });

  it('should support buildFromSegments utility', () => {
    const key = builder.buildFromSegments([
      'tenant-config',
      'tenant-003',
      'custom',
    ]);

    expect(key).toBe('tenant-config:tenant-003:custom');
  });

  it('should throw when segment is undefined in buildFromSegments', () => {
    expect(() =>
      builder.buildFromSegments([
        'tenant-config',
        undefined as unknown as string,
        'custom',
      ]),
    ).toThrow(GeneralBadRequestException);
  });

  it('should throw when segment is null in buildFromSegments', () => {
    expect(() =>
      builder.buildFromSegments([
        'tenant-config',
        null as unknown as string,
        'custom',
      ]),
    ).toThrow(GeneralBadRequestException);
  });

  it('should throw when segment is empty string in buildFromSegments', () => {
    expect(() =>
      builder.buildFromSegments(['tenant-config', '', 'custom']),
    ).toThrow(GeneralBadRequestException);
  });

  it('should throw when segment is whitespace only in buildFromSegments', () => {
    expect(() =>
      builder.buildFromSegments(['tenant-config', '   ', 'custom']),
    ).toThrow(GeneralBadRequestException);
  });

  it('should throw when segments array is empty in buildFromSegments', () => {
    expect(() => builder.buildFromSegments([])).toThrow(
      GeneralBadRequestException,
    );
  });

  it('should handle segments with spaces and log warning', () => {
    const payload: TenantConfigKeyPayload = {
      tenantId: 'tenant-001',
      configKey: 'key with spaces',
      variant: 'variant with spaces',
    };

    const key = builder.build(payload);

    expect(key).toContain('keywithspaces');
    expect(key).toContain('variantwithspaces');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should trim and normalize segment whitespace', () => {
    const payload: TenantConfigKeyPayload = {
      tenantId: '  tenant-001  ',
      configKey: '  config  ',
    };

    const key = builder.build(payload);

    expect(key).toBe('tenant-config:tenant-001:config');
    expect(key).not.toContain(' ');
  });

  it('should handle numeric segments in buildFromSegments', () => {
    const key = builder.buildFromSegments(['tenant-config', 123, 'custom']);

    expect(key).toBe('tenant-config:123:custom');
  });

  it('should handle segments with multiple spaces', () => {
    const payload: TenantConfigKeyPayload = {
      tenantId: 'tenant-001',
      configKey: 'key   with   multiple   spaces',
    };

    const key = builder.build(payload);

    expect(key).toContain('keywithmultiplespaces');
    expect(key).not.toContain(' ');
  });

  it('should handle tabs and newlines in segments', () => {
    const payload: TenantConfigKeyPayload = {
      tenantId: 'tenant-001',
      configKey: 'key\twith\nnewlines',
    };

    const key = builder.build(payload);

    expect(key).toContain('keywithnewlines');
    expect(key).not.toMatch(/[\t\n]/);
  });

  describe('AbstractCacheKeyBuilder 边界情况', () => {
    /**
     * @description 测试用的键构建器子类，用于测试 separator 为空的情况
     */
    class TestKeyBuilder extends AbstractCacheKeyBuilder<string> {
      protected getNamespace(): string {
        return 'test';
      }

      protected getKeyParts(): Array<string | number> {
        return ['key'];
      }

      protected getSeparator(): string {
        return ''; // 返回空字符串以测试异常情况
      }
    }

    it('should throw when separator is empty', () => {
      const testBuilder = new TestKeyBuilder(logger as unknown as CacheLogger);
      expect(() => testBuilder.build('test')).toThrow(
        GeneralBadRequestException,
      );
    });

    it('should throw when separator is empty in buildFromSegments', () => {
      const testBuilder = new TestKeyBuilder(logger as unknown as CacheLogger);
      expect(() => testBuilder.buildFromSegments(['test', 'key'])).toThrow(
        GeneralBadRequestException,
      );
    });
  });
});
