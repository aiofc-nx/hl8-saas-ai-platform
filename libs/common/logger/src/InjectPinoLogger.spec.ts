import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  InjectPinoLogger,
  createProvidersForDecorated,
  getLoggerToken,
} from './InjectPinoLogger.js';
import { PinoLogger } from './PinoLogger.js';

describe('InjectPinoLogger', () => {
  beforeEach(() => {
    // 清除已注册的上下文集合（如果可能）
    // 注意：由于 decoratedLoggers 是模块级变量，我们无法直接重置
    // 但每次测试应该从干净的状态开始
  });

  describe('getLoggerToken', () => {
    it('应生成正确的日志记录器令牌', () => {
      expect(getLoggerToken('UserService')).toBe('PinoLogger:UserService');
      expect(getLoggerToken('')).toBe('PinoLogger:');
      expect(getLoggerToken('AuthService')).toBe('PinoLogger:AuthService');
    });
  });

  describe('InjectPinoLogger', () => {
    it('应返回依赖注入装饰器', () => {
      const decorator = InjectPinoLogger('TestService');

      // 装饰器应该是一个函数（NestJS Inject 装饰器）
      expect(typeof decorator).toBe('function');
    });

    it('应注册上下文到装饰器集合', () => {
      // 创建装饰器应该注册上下文
      InjectPinoLogger('TestContext1');
      InjectPinoLogger('TestContext2');
      InjectPinoLogger('');

      // 验证提供者已创建
      const providers = createProvidersForDecorated();
      expect(providers.length).toBeGreaterThanOrEqual(3);
    });

    it('应为每个上下文创建提供者', () => {
      InjectPinoLogger('ProviderTest1');
      InjectPinoLogger('ProviderTest2');

      const providers = createProvidersForDecorated();

      // 验证提供者配置
      const token1 = getLoggerToken('ProviderTest1');
      const token2 = getLoggerToken('ProviderTest2');

      const provider1 = providers.find((p) => p.provide === token1);
      const provider2 = providers.find((p) => p.provide === token2);

      expect(provider1).toBeDefined();
      expect(provider2).toBeDefined();
      expect(provider1?.inject).toContain(PinoLogger);
      expect(provider2?.inject).toContain(PinoLogger);
    });
  });

  describe('createProvidersForDecorated', () => {
    it('应为已注册的上下文创建提供者数组', () => {
      InjectPinoLogger('CreateProviderTest');

      const providers = createProvidersForDecorated();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);

      // 验证提供者结构
      const provider = providers[0];
      expect(provider).toHaveProperty('provide');
      expect(provider).toHaveProperty('useFactory');
      expect(provider).toHaveProperty('inject');
    });

    it('提供的 useFactory 应设置上下文', () => {
      InjectPinoLogger('FactoryTest');

      const providers = createProvidersForDecorated();
      const provider = providers.find(
        (p) => p.provide === getLoggerToken('FactoryTest'),
      );

      expect(provider).toBeDefined();

      // 模拟 PinoLogger 实例
      const mockLogger = {
        setContext: jest.fn(),
      } as unknown as PinoLogger;

      // 调用 useFactory
      if (provider?.useFactory) {
        const result = provider.useFactory(mockLogger);
        expect(result).toBe(mockLogger);
        expect(mockLogger.setContext).toHaveBeenCalledWith('FactoryTest');
      }
    });
  });
});
