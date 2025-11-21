/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage, ServerResponse } from 'node:http';

import {
  DynamicModule,
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  type Provider,
} from '@nestjs/common';
import { pinoHttp } from 'pino-http';

import { createProvidersForDecorated } from './InjectPinoLogger.js';
import { Logger } from './Logger.js';
import type { LoggerModuleAsyncParams, Params } from './params.js';
import { PARAMS_PROVIDER_TOKEN } from './params.js';
import { PinoLogger } from './PinoLogger.js';
import { Store, storage } from './storage.js';

/**
 * 默认路由配置
 *
 * @description NestJS@11 仍然支持 express@4 的 `*` 风格路由，为了向后兼容性保留此配置。
 * 在下一个主要版本的 NestJS 中，我们可以将其替换为 `/{*splat}`，并放弃对 NestJS@9 及以下版本的支持。
 */
const DEFAULT_ROUTES = [{ path: '*', method: RequestMethod.ALL }];

/**
 * 日志模块
 *
 * @description 提供基于 Pino 的企业级日志基础设施模块。
 * 该模块是全局模块，一旦导入即可在整个应用中通过依赖注入使用日志服务。
 *
 * 主要功能：
 * - 自动 HTTP 请求/响应日志记录
 * - 支持同步和异步配置
 * - 请求上下文管理和作用域隔离
 * - 与 NestJS 异常处理器兼容
 * - 支持装饰器注入日志实例
 *
 * @example
 * ```typescript
 * // 基础使用
 * @Module({
 *   imports: [
 *     LoggerModule.forRoot({
 *       pinoHttp: {
 *         level: 'info',
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 异步配置
 * @Module({
 *   imports: [
 *     LoggerModule.forRootAsync({
 *       useFactory: (configService: ConfigService) => ({
 *         pinoHttp: {
 *           level: configService.get('LOG_LEVEL'),
 *         },
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({ providers: [Logger], exports: [Logger] })
export class LoggerModule implements NestModule {
  /**
   * 同步配置日志模块
   *
   * @description 使用同步配置方式初始化日志模块。适用于配置参数可以直接获取的场景。
   *
   * @param params - 日志模块配置参数
   * @param params.pinoHttp - Pino HTTP 中间件配置选项，可选
   * @param params.exclude - 需要排除日志记录的路由，可选
   * @param params.forRoutes - 需要应用日志中间件的路由，可选，默认为所有路由
   * @param params.useExisting - 是否使用已存在的日志实例，可选
   * @param params.renameContext - 重命名日志上下文字段名称，可选
   * @param params.assignResponse - 是否同时为响应日志分配字段，可选
   * @returns 动态模块配置
   *
   * @example
   * ```typescript
   * LoggerModule.forRoot({
   *   pinoHttp: {
   *     level: 'info',
   *     autoLogging: true,
   *   },
   *   exclude: [{ path: '/health', method: RequestMethod.GET }],
   *   renameContext: 'module',
   * })
   * ```
   */
  static forRoot(params?: Params | undefined): DynamicModule {
    const paramsProvider: Provider<Params> = {
      provide: PARAMS_PROVIDER_TOKEN,
      useValue: params || {},
    };

    const decorated = createProvidersForDecorated();

    return {
      module: LoggerModule,
      providers: [Logger, ...decorated, PinoLogger, paramsProvider],
      exports: [Logger, ...decorated, PinoLogger, paramsProvider],
    };
  }

  /**
   * 异步配置日志模块
   *
   * @description 使用异步配置方式初始化日志模块。适用于配置参数需要从异步源（如配置服务、数据库）获取的场景。
   *
   * @param params - 异步配置参数
   * @param params.useFactory - 工厂函数，用于生成配置参数
   * @param params.inject - 需要注入的依赖令牌列表，可选
   * @param params.imports - 需要导入的模块列表，可选
   * @param params.providers - 需要提供的其他提供者列表，可选
   * @returns 动态模块配置
   *
   * @example
   * ```typescript
   * LoggerModule.forRootAsync({
   *   imports: [ConfigModule],
   *   useFactory: (configService: ConfigService) => ({
   *     pinoHttp: {
   *       level: configService.get('LOG_LEVEL', 'info'),
   *     },
   *   }),
   *   inject: [ConfigService],
   * })
   * ```
   */
  static forRootAsync(params: LoggerModuleAsyncParams): DynamicModule {
    const paramsProvider: Provider<Params | Promise<Params>> = {
      provide: PARAMS_PROVIDER_TOKEN,
      useFactory: params.useFactory,
      inject: params.inject,
    };

    const decorated = createProvidersForDecorated();

    // 使用 any 类型以兼容 NestJS 提供者数组类型
    const providers: Array<Provider<any>> = [
      Logger,
      ...decorated,
      PinoLogger,
      paramsProvider,
      ...(params.providers || []),
    ];

    return {
      module: LoggerModule,
      imports: params.imports,
      providers,
      exports: [Logger, ...decorated, PinoLogger, paramsProvider],
    };
  }

  /**
   * 构造函数
   *
   * @description 注入日志模块配置参数，用于后续的中间件配置。
   *
   * @param params - 日志模块配置参数，通过依赖注入提供
   */
  constructor(@Inject(PARAMS_PROVIDER_TOKEN) private readonly params: Params) {}

  /**
   * 配置中间件
   *
   * @description 配置日志中间件，将 Pino HTTP 中间件应用到指定的路由。
   * 支持路由排除和自定义路由配置。
   *
   * @param consumer - NestJS 中间件消费者，用于配置中间件应用的路由
   *
   * @example
   * ```typescript
   * // 在 Params 中配置
   * {
   *   forRoutes: [{ path: '/api/*', method: RequestMethod.ALL }],
   *   exclude: [{ path: '/health', method: RequestMethod.GET }],
   * }
   * ```
   */
  configure(consumer: MiddlewareConsumer) {
    const {
      exclude,
      forRoutes = DEFAULT_ROUTES,
      pinoHttp,
      useExisting,
      assignResponse,
    } = this.params;

    const middlewares = createLoggerMiddlewares(
      pinoHttp || {},
      useExisting,
      assignResponse,
    );

    if (exclude) {
      consumer
        .apply(...middlewares)
        .exclude(...(exclude as any))
        .forRoutes(...(forRoutes as any));
    } else {
      consumer.apply(...middlewares).forRoutes(...(forRoutes as any));
    }
  }
}

/**
 * 创建日志中间件数组
 *
 * @description 根据配置参数创建日志中间件数组。
 * 如果使用已存在的日志实例，则只创建绑定中间件；否则创建 Pino HTTP 中间件和绑定中间件。
 *
 * @param params - Pino HTTP 配置参数或目标流
 * @param useExisting - 是否使用已存在的日志实例，默认为 false
 * @param assignResponse - 是否同时为响应日志分配字段，默认为 false
 * @returns 中间件数组，包含 Pino HTTP 中间件和日志绑定中间件
 *
 * @internal
 */
function createLoggerMiddlewares(
  params: NonNullable<Params['pinoHttp']>,
  useExisting = false,
  assignResponse = false,
) {
  if (useExisting) {
    return [bindLoggerMiddlewareFactory(useExisting, assignResponse)];
  }

  const middleware = pinoHttp(
    ...(Array.isArray(params) ? params : [params as any]),
  );

  // @ts-expect-error: root is readonly field, but this is the place where
  // it's set actually
  PinoLogger.root = middleware.logger;

  // FIXME: params type here is pinoHttp.Options | pino.DestinationStream
  // pinoHttp has two overloads, each of them takes those types
  return [middleware, bindLoggerMiddlewareFactory(useExisting, assignResponse)];
}

/**
 * 创建日志绑定中间件工厂函数
 *
 * @description 创建一个中间件工厂函数，用于将日志实例绑定到请求上下文。
 * 该中间件会在请求处理过程中维护日志实例的作用域，确保日志记录包含正确的请求上下文信息。
 *
 * @param useExisting - 是否使用已存在的日志实例
 * @param assignResponse - 是否同时为响应日志分配字段
 * @returns 日志绑定中间件函数
 *
 * @internal
 */
function bindLoggerMiddlewareFactory(
  useExisting: boolean,
  assignResponse: boolean,
) {
  /**
   * 日志绑定中间件
   *
   * @description 将日志实例绑定到当前请求的异步本地存储中，
   * 确保在请求处理过程中可以访问正确的日志实例。
   *
   * @param req - HTTP 请求对象
   * @param res - HTTP 响应对象
   * @param next - 下一个中间件函数
   */
  return function bindLoggerMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) {
    let log = req.log;
    let resLog = assignResponse ? res.log : undefined;

    if (!useExisting && req.allLogs) {
      log = req.allLogs[req.allLogs.length - 1]!;
    }
    if (assignResponse && !useExisting && res.allLogs) {
      resLog = res.allLogs[res.allLogs.length - 1]!;
    }

    storage.run(new Store(log as any, resLog as any), next);
  };
}
