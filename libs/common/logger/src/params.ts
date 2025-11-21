/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MiddlewareConsumer, ModuleMetadata } from '@nestjs/common';
import { DestinationStream, Logger } from 'pino';
import { Options } from 'pino-http';

/**
 * 已传递的日志记录器类型
 *
 * @description 当配置参数中包含已创建的日志记录器实例时使用此类型。
 * 允许直接使用外部创建的 Pino 日志记录器实例。
 */
export type PassedLogger = { logger: Logger };

/**
 * 日志模块配置参数
 *
 * @description 用于配置 LoggerModule 的参数接口。
 * 包含 Pino HTTP 中间件配置、路由配置、上下文配置等选项。
 *
 * @example
 * ```typescript
 * const params: Params = {
 *   pinoHttp: {
 *     level: 'info',
 *     autoLogging: true,
 *   },
 *   exclude: [{ path: '/health', method: RequestMethod.GET }],
 *   renameContext: 'module',
 * };
 * ```
 */
export interface Params {
  /**
   * Pino HTTP 中间件配置参数
   *
   * @description 可选的 `pino-http` 模块配置参数。
   * 可以是配置选项对象、目标流，或者是配置选项和目标流的元组。
   *
   * @see {@link https://github.com/pinojs/pino-http#pinohttpopts-stream pino-http 文档}
   */
  pinoHttp?: Options | DestinationStream | [Options, DestinationStream];

  /**
   * 需要排除日志记录的路由
   *
   * @description 可选的路由排除配置参数。
   * 应该实现 NestJS 内置 `MiddlewareConfigProxy['exclude']` 的参数接口。
   *
   * 可以用于：
   * - 禁用指定路由的自动请求/响应日志记录
   * - 移除指定路由的请求上下文（后续应用日志也不包含请求上下文）
   *
   * 默认情况下，日志中间件应用于所有路由。
   * 如果只需要关闭某些路由的自动请求/响应日志记录，但保留应用日志的请求上下文，
   * 请使用 `pinoHttp.autoLogging` 字段。
   *
   * @see {@link https://docs.nestjs.com/middleware#applying-middleware NestJS 中间件文档}
   *
   * @example
   * ```typescript
   * exclude: [
   *   { path: '/health', method: RequestMethod.GET },
   *   { path: '/metrics', method: RequestMethod.GET },
   * ]
   * ```
   */
  exclude?: Parameters<MiddlewareConsumer['apply']>[0][];

  /**
   * 需要应用日志中间件的路由
   *
   * @description 可选的路由配置参数。
   * 应该实现 NestJS 内置 `MiddlewareConfigProxy['forRoutes']` 的参数接口。
   *
   * 可以用于：
   * - 仅为指定路由启用自动请求/响应日志记录
   * - 仅为指定路由启用请求上下文
   *
   * 默认情况下，日志中间件应用于所有路由。
   * 如果只需要为某些路由启用自动请求/响应日志记录，但保留所有路由的应用日志请求上下文，
   * 请使用 `pinoHttp.autoLogging` 字段。
   *
   * @see {@link https://docs.nestjs.com/middleware#applying-middleware NestJS 中间件文档}
   *
   * @example
   * ```typescript
   * forRoutes: [
   *   { path: '/api/*', method: RequestMethod.ALL },
   *   UserController,
   * ]
   * ```
   */
  forRoutes?: Parameters<MiddlewareConsumer['apply']>[0][];

  /**
   * 是否使用已存在的日志实例
   *
   * @description 可选参数，用于跳过 Pino 配置，使用已存在的日志实例。
   * 适用于使用 FastifyAdapter 且已在适配器配置中配置日志的场景。
   *
   * 使用此选项的优缺点在文档的 FAQ 部分有详细说明。
   *
   * @see {@link https://github.com/iamolegga/nestjs-pino#faq nestjs-pino FAQ}
   *
   * @example
   * ```typescript
   * // 当使用 FastifyAdapter 且已在适配器中配置日志时
   * useExisting: true
   * ```
   */
  useExisting?: true;

  /**
   * 重命名上下文字段名称
   *
   * @description 可选参数，用于更改日志记录中上下文属性的字段名称。
   * 默认字段名称为 `context`，可以通过此参数自定义。
   *
   * @example
   * ```typescript
   * renameContext: 'module'
   * // 日志输出：{"level":30, ... "module":"AppController"}
   * ```
   */
  renameContext?: string;

  /**
   * 是否为响应日志分配字段
   *
   * @description 可选参数，用于控制在调用 `PinoLogger.assign` 时是否同时为响应日志分配字段。
   * 默认情况下，`assign` 方法不会影响响应日志（如 "Request completed" 日志）。
   * 如果设置为 true，则响应日志也会包含分配的字段。
   *
   * @example
   * ```typescript
   * assignResponse: true
   * // 在请求处理过程中调用 logger.assign({ userId: 123 })
   * // 响应日志中也会包含 userId: 123
   * ```
   */
  assignResponse?: boolean;
}

/**
 * 日志模块异步配置参数
 *
 * @description 用于异步配置 LoggerModule 的参数接口。
 * 支持通过工厂函数异步生成配置参数，并可注入其他依赖。
 *
 * 注意：为了支持 nestjs@8，我们没有直接继承 `FactoryProvider` 的 `useFactory` 类型。
 * 因为在 v8 中 `useFactory` 的返回类型是 `T`，而在后续版本中是 `T | Promise<T>`，类型不兼容。
 *
 * @example
 * ```typescript
 * LoggerModule.forRootAsync({
 *   imports: [ConfigModule],
 *   useFactory: (configService: ConfigService) => ({
 *     pinoHttp: {
 *       level: configService.get('LOG_LEVEL'),
 *     },
 *   }),
 *   inject: [ConfigService],
 * })
 * ```
 */
export interface LoggerModuleAsyncParams
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  /**
   * 工厂函数，用于生成配置参数
   *
   * @description 异步工厂函数，用于生成日志模块配置参数。
   * 可以返回同步或异步的配置参数。
   *
   * @param args - 注入的依赖参数数组
   * @returns 配置参数对象，可以是同步或异步的
   *
   * @note 使用 any[] 以兼容 NestJS 工厂提供者接口，支持注入任意类型的依赖
   */
  useFactory: (...args: any[]) => Params | Promise<Params>;

  /**
   * 需要注入的依赖令牌列表
   *
   * @description 可选参数，指定需要在工厂函数中注入的依赖令牌。
   * 这些依赖会作为参数传递给 useFactory 函数。
   *
   * @example
   * ```typescript
   * inject: [ConfigService, DatabaseService]
   * // useFactory 函数会接收到这两个服务实例
   * ```
   *
   * @note 使用 any[] 以兼容 NestJS 依赖注入系统，支持任意类型的令牌
   */
  inject?: any[];
}

/**
 * 类型守卫：检查是否为已传递的日志记录器
 *
 * @description 用于判断配置参数中的 pinoHttp 属性是否为已创建的日志记录器实例。
 * 当检测到 pinoHttp 是 PassedLogger 类型时，会直接使用该日志记录器实例。
 *
 * @param pinoHttpProp - 待检查的 pinoHttp 属性值
 * @returns 如果 pinoHttpProp 是 PassedLogger 类型，返回 true；否则返回 false
 *
 * @example
 * ```typescript
 * if (isPassedLogger(pinoHttp)) {
 *   // 使用已存在的日志记录器
 *   logger = pinoHttp.logger;
 * }
 * ```
 *
 * @note 使用 any 类型以兼容 pinoHttp 配置参数的各种可能类型
 */
export function isPassedLogger(
  pinoHttpProp: any,
): pinoHttpProp is PassedLogger {
  return (
    !!pinoHttpProp &&
    typeof pinoHttpProp === 'object' &&
    'logger' in pinoHttpProp
  );
}

/**
 * 配置参数提供者令牌
 *
 * @description 用于在依赖注入容器中标识配置参数提供者的令牌。
 * 通过此令牌可以注入配置参数到需要的地方。
 */
export const PARAMS_PROVIDER_TOKEN = 'pino-params';
