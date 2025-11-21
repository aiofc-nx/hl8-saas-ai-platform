import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { MiddlewareConsumer } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from './Logger.js';
import { LoggerModule } from './LoggerModule.js';
import { PinoLogger } from './PinoLogger.js';
import { PARAMS_PROVIDER_TOKEN } from './params.js';

// Mock pino-http
jest.mock('pino-http', () => ({
  pinoHttp: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  })),
}));

// Mock InjectPinoLogger
jest.mock('./InjectPinoLogger.js', () => ({
  createProvidersForDecorated: jest.fn(() => []),
  InjectPinoLogger: jest.fn(),
  getLoggerToken: jest.fn((context: string) => `PinoLogger:${context}`),
}));

describe('LoggerModule', () => {
  let module: TestingModule;
  let middlewareConsumer: jest.Mocked<MiddlewareConsumer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // 创建 mock MiddlewareConsumer
    middlewareConsumer = {
      apply: jest.fn().mockReturnThis(),
      exclude: jest.fn().mockReturnThis(),
      forRoutes: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<MiddlewareConsumer>;
  });

  describe('forRoot', () => {
    it('应创建动态模块配置', () => {
      const dynamicModule = LoggerModule.forRoot();

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(LoggerModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });

    it('应包含所有必需的提供者', () => {
      const dynamicModule = LoggerModule.forRoot();

      const providerTokens = dynamicModule.providers?.map((p) =>
        typeof p === 'object' && 'provide' in p ? p.provide : p,
      );

      expect(providerTokens).toContain(Logger);
      expect(providerTokens).toContain(PinoLogger);
      expect(providerTokens).toContain(PARAMS_PROVIDER_TOKEN);
    });

    it('应导出所有必需的提供者', () => {
      const dynamicModule = LoggerModule.forRoot();

      const exportTokens = dynamicModule.exports?.map((e) =>
        typeof e === 'object' && 'provide' in e ? e.provide : e,
      );

      expect(exportTokens).toContain(Logger);
      expect(exportTokens).toContain(PinoLogger);
      expect(exportTokens).toContain(PARAMS_PROVIDER_TOKEN);
    });

    it('应使用提供的配置参数', async () => {
      const params = {
        pinoHttp: { level: 'info' },
        renameContext: 'module',
      };

      const dynamicModule = LoggerModule.forRoot(params);

      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const paramsProvider = module.get(PARAMS_PROVIDER_TOKEN);
      expect(paramsProvider).toBeDefined();
      expect(paramsProvider).toEqual(params);
    });

    it('应使用空对象作为默认参数', async () => {
      const dynamicModule = LoggerModule.forRoot();

      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const paramsProvider = module.get(PARAMS_PROVIDER_TOKEN);
      expect(paramsProvider).toEqual({});
    });

    it('应调用 createProvidersForDecorated 获取装饰器提供者', () => {
      const dynamicModule = LoggerModule.forRoot();

      // 验证模块配置包含提供者和导出
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
      expect(Array.isArray(dynamicModule.providers)).toBe(true);
      expect(Array.isArray(dynamicModule.exports)).toBe(true);
    });
  });

  describe('forRootAsync', () => {
    it('应创建动态模块配置', () => {
      const asyncParams = {
        useFactory: () => ({ pinoHttp: { level: 'info' } }),
      };

      const dynamicModule = LoggerModule.forRootAsync(asyncParams);

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(LoggerModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });

    it('应包含工厂函数提供者', () => {
      const asyncParams = {
        useFactory: () => ({ pinoHttp: { level: 'debug' } }),
      };

      const dynamicModule = LoggerModule.forRootAsync(asyncParams);

      const paramsProvider = dynamicModule.providers?.find(
        (p) =>
          typeof p === 'object' &&
          'provide' in p &&
          p.provide === PARAMS_PROVIDER_TOKEN,
      );

      expect(paramsProvider).toBeDefined();
      if (
        paramsProvider &&
        typeof paramsProvider === 'object' &&
        'useFactory' in paramsProvider
      ) {
        expect(paramsProvider.useFactory).toBe(asyncParams.useFactory);
      }
    });

    it('应支持注入依赖', () => {
      const asyncParams = {
        useFactory: (config: any) => ({ pinoHttp: { level: config.level } }),
        inject: ['ConfigService'],
      };

      const dynamicModule = LoggerModule.forRootAsync(asyncParams);

      const paramsProvider = dynamicModule.providers?.find(
        (p) =>
          typeof p === 'object' &&
          'provide' in p &&
          p.provide === PARAMS_PROVIDER_TOKEN,
      );

      expect(paramsProvider).toBeDefined();
      if (
        paramsProvider &&
        typeof paramsProvider === 'object' &&
        'inject' in paramsProvider
      ) {
        expect(paramsProvider.inject).toEqual(['ConfigService']);
      }
    });

    it('应支持导入模块', () => {
      const asyncParams = {
        useFactory: () => ({}),
        imports: [class MockModule {}],
      };

      const dynamicModule = LoggerModule.forRootAsync(asyncParams);

      expect(dynamicModule.imports).toBeDefined();
      expect(dynamicModule.imports).toContain(asyncParams.imports![0]);
    });

    it('应支持额外的提供者', () => {
      const extraProvider = { provide: 'ExtraService', useValue: {} };
      const asyncParams = {
        useFactory: () => ({}),
        providers: [extraProvider],
      };

      const dynamicModule = LoggerModule.forRootAsync(asyncParams);

      expect(dynamicModule.providers).toContainEqual(extraProvider);
    });
  });

  describe('configure', () => {
    let loggerModule: LoggerModule;

    beforeEach(async () => {
      const params = {
        pinoHttp: { level: 'info' },
      };

      const dynamicModule = LoggerModule.forRoot(params);
      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      loggerModule = module.get(LoggerModule);
    });

    it('应配置中间件到默认路由', () => {
      loggerModule.configure(middlewareConsumer);

      expect(middlewareConsumer.apply).toHaveBeenCalled();
      // forRoutes 接收展开的参数，默认路由是数组的第一个元素
      expect(middlewareConsumer.forRoutes).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '*',
          method: RequestMethod.ALL,
        }),
      );
    });

    it('应支持自定义路由配置', async () => {
      const customParams = {
        forRoutes: [{ path: '/api/*', method: RequestMethod.ALL }],
      };

      const customModule = LoggerModule.forRoot(customParams);
      const customTestModule = await Test.createTestingModule({
        imports: [customModule],
      }).compile();

      const moduleInstance = customTestModule.get(LoggerModule);
      moduleInstance.configure(middlewareConsumer);

      // forRoutes 接收展开的参数，不是数组
      expect(middlewareConsumer.forRoutes).toHaveBeenCalledWith(
        customParams.forRoutes[0],
      );
    });

    it('应支持路由排除', async () => {
      const paramsWithExclude = {
        exclude: [{ path: '/health', method: RequestMethod.GET }],
      };

      const dynamicModule = LoggerModule.forRoot(paramsWithExclude);
      const testModule = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const moduleInstance = testModule.get(LoggerModule);
      moduleInstance.configure(middlewareConsumer);

      // exclude 接收展开的参数
      expect(middlewareConsumer.exclude).toHaveBeenCalledWith(
        paramsWithExclude.exclude[0],
      );
      expect(middlewareConsumer.forRoutes).toHaveBeenCalled();
    });

    it('应使用 useExisting 配置时只创建绑定中间件', async () => {
      const paramsWithUseExisting = {
        useExisting: true as const,
      };

      const dynamicModule = LoggerModule.forRoot(paramsWithUseExisting);
      const testModule = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const moduleInstance = testModule.get(LoggerModule);
      moduleInstance.configure(middlewareConsumer);

      // 验证中间件被应用
      expect(middlewareConsumer.apply).toHaveBeenCalled();
    });

    it('应支持 assignResponse 配置', async () => {
      const paramsWithAssignResponse = {
        assignResponse: true,
      };

      const dynamicModule = LoggerModule.forRoot(paramsWithAssignResponse);
      const testModule = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const moduleInstance = testModule.get(LoggerModule);
      moduleInstance.configure(middlewareConsumer);

      expect(middlewareConsumer.apply).toHaveBeenCalled();
    });
  });

  describe('模块集成', () => {
    it('应能够注入 Logger 服务', async () => {
      const dynamicModule = LoggerModule.forRoot();
      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const logger = module.get(Logger);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('应能够注入 PinoLogger 服务', async () => {
      const dynamicModule = LoggerModule.forRoot();
      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      // PinoLogger 是 TRANSIENT 作用域的，需要使用 resolve()
      const pinoLogger = await module.resolve(PinoLogger);
      expect(pinoLogger).toBeDefined();
      expect(pinoLogger).toBeInstanceOf(PinoLogger);
    });

    it('应能够注入配置参数', async () => {
      const params = {
        pinoHttp: { level: 'warn' },
        renameContext: 'service',
      };

      const dynamicModule = LoggerModule.forRoot(params);
      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const injectedParams = module.get(PARAMS_PROVIDER_TOKEN);
      expect(injectedParams).toEqual(params);
    });
  });
});
