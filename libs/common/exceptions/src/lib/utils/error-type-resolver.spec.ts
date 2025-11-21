import {
  configureErrorTypeResolver,
  resetErrorTypeResolver,
  resolveErrorType,
} from './error-type-resolver.js';

describe('error-type-resolver', () => {
  beforeEach(() => {
    resetErrorTypeResolver();
  });

  afterEach(() => {
    resetErrorTypeResolver();
  });

  describe('resolveErrorType', () => {
    it('无配置时应返回默认值', () => {
      expect(resolveErrorType()).toBe('about:blank');
      expect(resolveErrorType('UNKNOWN')).toBe('about:blank');
    });

    it('应优先使用自定义类型', () => {
      configureErrorTypeResolver({
        baseUrl: 'https://api.example.com/docs/errors',
      });

      expect(
        resolveErrorType('USER_NOT_FOUND', 'https://custom.com/error'),
      ).toBe('https://custom.com/error');
    });

    it('应使用全局配置生成 URL', () => {
      configureErrorTypeResolver({
        baseUrl: 'https://api.example.com/docs/errors',
        defaultPath: '/general',
      });

      expect(resolveErrorType('UNKNOWN')).toBe(
        'https://api.example.com/docs/errors/general',
      );
    });

    it('应使用错误码映射', () => {
      configureErrorTypeResolver({
        baseUrl: 'https://api.example.com/docs/errors',
        errorCodeMap: {
          USER_NOT_FOUND: '/user-not-found',
          INVALID_EMAIL: '/validation/invalid-email',
        },
        defaultPath: '/general',
      });

      expect(resolveErrorType('USER_NOT_FOUND')).toBe(
        'https://api.example.com/docs/errors/user-not-found',
      );
      expect(resolveErrorType('INVALID_EMAIL')).toBe(
        'https://api.example.com/docs/errors/validation/invalid-email',
      );
      expect(resolveErrorType('UNKNOWN')).toBe(
        'https://api.example.com/docs/errors/general',
      );
    });

    it('应处理路径前缀', () => {
      configureErrorTypeResolver({
        baseUrl: 'https://api.example.com/docs/errors',
        errorCodeMap: {
          TEST: 'no-slash',
        },
      });

      expect(resolveErrorType('TEST')).toBe(
        'https://api.example.com/docs/errors/no-slash',
      );
    });

    it('应处理无 baseUrl 的情况', () => {
      configureErrorTypeResolver({
        errorCodeMap: {
          TEST: '/test',
        },
      });

      expect(resolveErrorType('TEST')).toBe('about:blank');
    });
  });

  describe('configureErrorTypeResolver', () => {
    it('应正确设置全局配置', () => {
      const config = {
        baseUrl: 'https://api.example.com/docs/errors',
        errorCodeMap: { TEST: '/test' },
      };

      configureErrorTypeResolver(config);

      expect(resolveErrorType('TEST')).toBe(
        'https://api.example.com/docs/errors/test',
      );
    });

    it('应支持覆盖配置', () => {
      configureErrorTypeResolver({
        baseUrl: 'https://old.com',
      });

      configureErrorTypeResolver({
        baseUrl: 'https://new.com',
      });

      expect(resolveErrorType('TEST')).toBe('https://new.com/general');
    });
  });

  describe('resetErrorTypeResolver', () => {
    it('应重置全局配置', () => {
      configureErrorTypeResolver({
        baseUrl: 'https://api.example.com/docs/errors',
      });

      resetErrorTypeResolver();

      expect(resolveErrorType('TEST')).toBe('about:blank');
    });
  });
});
