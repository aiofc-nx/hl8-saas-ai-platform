/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Level } from 'pino';

import type { Params } from './params.js';
import { PARAMS_PROVIDER_TOKEN } from './params.js';
import { PinoLogger } from './PinoLogger.js';

/**
 * NestJS 日志服务适配器
 *
 * @description 实现了 NestJS 的 LoggerService 接口，将 NestJS 标准的日志方法映射到 Pino 日志记录器。
 * 该类提供了与 NestJS 内置日志服务兼容的接口，同时享受 Pino 高性能日志记录的优势。
 *
 * 主要特性：
 * - 兼容 NestJS LoggerService 接口
 * - 支持所有标准日志级别（verbose, debug, log, warn, error, fatal）
 * - 自动处理异常对象的序列化
 * - 支持上下文信息的传递
 * - 兼容 NestJS 异常处理器的特殊调用格式
 *
 * @example
 * ```typescript
 * // 通过依赖注入使用
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly logger: Logger) {}
 *
 *   async createUser(userData: CreateUserDto) {
 *     this.logger.log('创建用户', 'UserService');
 *     // ... 业务逻辑
 *   }
 * }
 * ```
 */
@Injectable()
export class Logger implements LoggerService {
  /**
   * 上下文字段名称
   *
   * @description 日志记录中用于存储上下文信息的字段名称，可通过 renameContext 参数自定义。
   */
  private readonly contextName: string;

  /**
   * 构造函数
   *
   * @description 初始化日志服务适配器，注入 Pino 日志记录器和配置参数。
   *
   * @param logger - Pino 日志记录器实例
   * @param renameContext - 配置参数对象，包含 renameContext 字段用于自定义上下文字段名称
   */
  constructor(
    protected readonly logger: PinoLogger,
    @Inject(PARAMS_PROVIDER_TOKEN) { renameContext }: Params,
  ) {
    this.contextName = renameContext || 'context';
  }

  /**
   * 记录详细日志
   *
   * @description 记录详细级别的日志信息，对应 Pino 的 trace 级别。
   * 用于记录非常详细的调试信息，通常仅在开发环境启用。
   *
   * @param message - 日志消息，可以是字符串、对象或 Error 实例
   * @param optionalParams - 可选参数，最后一个参数通常作为上下文信息
   *
   * @example
   * ```typescript
   * logger.verbose('详细调试信息', 'ComponentName');
   * logger.verbose({ userId: 123, action: 'login' }, 'UserService');
   * logger.verbose(new Error('详细错误'), 'ErrorHandler');
   * ```
   *
   * @note 使用 any 类型以兼容 NestJS LoggerService 接口
   */
  verbose(message: any, ...optionalParams: any[]) {
    this.call('trace', message, ...optionalParams);
  }

  /**
   * 记录调试日志
   *
   * @description 记录调试级别的日志信息，用于开发和调试阶段。
   *
   * @param message - 日志消息，可以是字符串、对象或 Error 实例
   * @param optionalParams - 可选参数，最后一个参数通常作为上下文信息
   *
   * @example
   * ```typescript
   * logger.debug('调试信息', 'ComponentName');
   * logger.debug({ requestId: 'req-123', status: 'processing' }, 'ApiHandler');
   * ```
   */
  debug(message: any, ...optionalParams: any[]) {
    this.call('debug', message, ...optionalParams);
  }

  /**
   * 记录信息日志
   *
   * @description 记录信息级别的日志，用于记录一般性的业务信息。
   * 这是最常用的日志级别，用于记录应用的正常运行状态。
   *
   * @param message - 日志消息，可以是字符串、对象或 Error 实例
   * @param optionalParams - 可选参数，最后一个参数通常作为上下文信息
   *
   * @example
   * ```typescript
   * logger.log('用户登录成功', 'AuthService');
   * logger.log({ userId: 123, loginTime: new Date() }, 'AuthService');
   * ```
   */
  log(message: any, ...optionalParams: any[]) {
    this.call('info', message, ...optionalParams);
  }

  /**
   * 记录警告日志
   *
   * @description 记录警告级别的日志，用于记录可能存在问题但不影响应用运行的场景。
   *
   * @param message - 日志消息，可以是字符串、对象或 Error 实例
   * @param optionalParams - 可选参数，最后一个参数通常作为上下文信息
   *
   * @example
   * ```typescript
   * logger.warn('API 响应时间较长', 'ApiService');
   * logger.warn({ responseTime: 5000, threshold: 3000 }, 'ApiService');
   * ```
   */
  warn(message: any, ...optionalParams: any[]) {
    this.call('warn', message, ...optionalParams);
  }

  /**
   * 记录错误日志
   *
   * @description 记录错误级别的日志，用于记录错误和异常情况。
   * 该方法会自动处理 NestJS 异常处理器的特殊调用格式。
   *
   * @param message - 日志消息，可以是字符串、对象或 Error 实例
   * @param optionalParams - 可选参数，最后一个参数通常作为上下文信息
   *
   * @example
   * ```typescript
   * logger.error('数据库连接失败', 'DatabaseService');
   * logger.error(new Error('连接超时'), 'DatabaseService');
   * logger.error({ error: 'Validation failed', field: 'email' }, 'ValidationService');
   * ```
   */
  error(message: any, ...optionalParams: any[]) {
    this.call('error', message, ...optionalParams);
  }

  /**
   * 记录致命错误日志
   *
   * @description 记录致命错误级别的日志，用于记录导致应用无法继续运行的严重错误。
   *
   * @param message - 日志消息，可以是字符串、对象或 Error 实例
   * @param optionalParams - 可选参数，最后一个参数通常作为上下文信息
   *
   * @example
   * ```typescript
   * logger.fatal('应用启动失败', 'BootstrapService');
   * logger.fatal(new Error('关键服务未就绪'), 'BootstrapService');
   * ```
   */
  fatal(message: any, ...optionalParams: any[]) {
    this.call('fatal', message, ...optionalParams);
  }

  /**
   * 内部日志调用方法
   *
   * @description 统一处理所有日志级别的调用逻辑，包括消息格式化、上下文提取和异常处理。
   * 该方法会自动识别消息类型（字符串、对象、Error），并正确处理 NestJS 异常处理器的特殊调用格式。
   *
   * @param level - 日志级别（trace, debug, info, warn, error, fatal）
   * @param message - 日志消息，可以是字符串、对象或 Error 实例
   * @param optionalParams - 可选参数数组，最后一个参数通常作为上下文信息
   *
   * @note 使用 any 类型以兼容 NestJS LoggerService 接口和多种消息格式
   *
   * @internal
   */
  private call(level: Level, message: any, ...optionalParams: any[]) {
    const objArg: Record<string, any> = {};

    // optionalParams contains extra params passed to logger
    // context name is the last item

    // 使用 any[] 以兼容 NestJS LoggerService 接口的多种参数格式
    let params: any[] = [];
    if (optionalParams.length !== 0) {
      objArg[this.contextName] = optionalParams[optionalParams.length - 1];
      params = optionalParams.slice(0, -1);
    }

    if (typeof message === 'object') {
      if (message instanceof Error) {
        objArg.err = message;
      } else {
        Object.assign(objArg, message);
      }
      this.logger[level](objArg, ...params);
    } else if (this.isWrongExceptionsHandlerContract(level, message, params)) {
      objArg.err = new Error(message);
      objArg.err.stack = params[0];
      this.logger[level](objArg);
    } else {
      this.logger[level](objArg, message, ...params);
    }
  }

  /**
   * 检查是否为 NestJS 异常处理器的错误调用格式
   *
   * @description NestJS 内置的异常处理器类（如 ExceptionsHandler、ExceptionHandler、WsExceptionsHandler、
   * RpcExceptionsHandler）在调用 logger.error 时使用了不标准的调用格式：
   * - 第一个参数是错误消息字符串
   * - 第二个参数是堆栈跟踪字符串
   *
   * 该方法用于识别这种特殊的调用格式，并正确转换为标准格式。
   *
   * @param level - 日志级别，只有 'error' 级别才可能是异常处理器的调用
   * @param message - 日志消息
   * @param params - 参数数组，可能包含堆栈跟踪字符串
   * @returns 如果参数格式匹配异常处理器的调用格式，返回 true；否则返回 false
   *
   * @see {@link https://github.com/nestjs/nest/blob/35baf7a077bb972469097c5fea2f184b7babadfc/packages/core/exceptions/base-exception-filter.ts#L60-L63 ExceptionsHandler}
   * @see {@link https://github.com/nestjs/nest/blob/99ee3fd99341bcddfa408d1604050a9571b19bc9/packages/core/errors/exception-handler.ts#L9 ExceptionHandler}
   * @see {@link https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/websockets/exceptions/base-ws-exception-filter.ts#L47-L50 WsExceptionsHandler}
   * @see {@link https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/microservices/exceptions/base-rpc-exception-filter.ts#L26-L30 RpcExceptionsHandler}
   *
   * @internal
   */
  private isWrongExceptionsHandlerContract(
    level: Level,
    message: any,
    params: any[],
  ): params is [string] {
    return (
      level === 'error' &&
      typeof message === 'string' &&
      params.length === 1 &&
      typeof params[0] === 'string' &&
      /\n\s*at /.test(params[0])
    );
  }
}
