/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, Scope } from '@nestjs/common';
import pino from 'pino';

import type { Params } from './params.js';
import { isPassedLogger, PARAMS_PROVIDER_TOKEN } from './params.js';
import { storage } from './storage.js';

type PinoMethods = Pick<
  pino.Logger,
  'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
>;

/**
 * 日志函数类型定义
 *
 * @description 这是 pino.LogFn 的副本，但允许方法重写。
 * 当前用法支持两种重载：
 * - trace(msg: string, ...args: any[]): void
 * - trace(obj: object, msg?: string, ...args: any[]): void
 *
 * 如果直接使用 pino.LogFn，会导致方法重写不兼容的问题。
 *
 * @internal
 */
type LoggerFn =
  | ((msg: string, ...args: any[]) => void)
  | ((obj: object, msg?: string, ...args: any[]) => void);

/**
 * 请求上下文外的日志记录器实例
 *
 * @description 用于在请求作用域外记录日志的 Pino 日志记录器实例。
 * 当不在请求处理过程中时，使用此实例进行日志记录。
 *
 * @internal
 */

let outOfContext: any;

/**
 * 重置请求上下文外的日志记录器（仅用于测试）
 *
 * @description 测试辅助函数，用于重置 outOfContext 和 PinoLogger.root 属性。
 * 仅在测试环境中使用，不应该在生产代码中调用。
 *
 * @internal
 */
export function __resetOutOfContextForTests() {
  outOfContext = undefined;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore reset root for tests only
  PinoLogger.root = undefined;
}

/**
 * Pino 日志记录器服务
 *
 * @description 基于 Pino 的高性能日志记录器实现。
 * 该类提供了完整的日志级别支持，并自动管理请求上下文。
 *
 * 主要特性：
 * - 支持所有标准日志级别（trace, debug, info, warn, error, fatal）
 * - 自动上下文管理和作用域隔离
 * - 支持请求作用域内的字段绑定
 * - 支持自定义上下文名称和错误键名
 * - 使用 TRANSIENT 作用域，确保每个注入点都有独立的实例
 *
 * @example
 * ```typescript
 * // 通过依赖注入使用
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly logger: PinoLogger) {
 *     this.logger.setContext('UserService');
 *   }
 *
 *   async createUser(userData: CreateUserDto) {
 *     this.logger.info('创建用户', { userId: userData.id });
 *     // ... 业务逻辑
 *   }
 * }
 *
 * // 使用装饰器注入
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectPinoLogger('UserService') private readonly logger: PinoLogger
 *   ) {}
 * }
 * ```
 */
@Injectable({ scope: Scope.TRANSIENT })
export class PinoLogger implements PinoMethods {
  /**
   * 根日志记录器实例
   *
   * @description 最顶层的日志记录器实例，可用于在运行时动态修改配置。
   * 只有在 Params 中未设置 useExisting 为 true 时才可访问。
   * 虽然属性本身是只读的，但可以修改其属性（如日志级别）。
   *
   * @example
   * ```typescript
   * // 动态修改日志级别
   * PinoLogger.root.level = 'debug';
   *
   * // 添加全局字段
   * PinoLogger.root.bindings().env = 'production';
   * ```
   */
  static readonly root: pino.Logger;

  /**
   * 日志上下文名称
   *
   * @description 当前日志记录器的上下文名称，用于标识日志来源。
   * 可通过 setContext 方法动态设置。
   */
  protected context = '';

  /**
   * 上下文字段名称
   *
   * @description 日志记录中用于存储上下文信息的字段名称，可通过 renameContext 参数自定义。
   */
  protected readonly contextName: string;

  /**
   * 错误字段名称
   *
   * @description 日志记录中用于存储错误信息的字段名称，默认为 'err'。
   * 可通过 pinoHttp.customAttributeKeys.err 参数自定义。
   */
  protected readonly errorKey: string = 'err';

  /**
   * 构造函数
   *
   * @description 初始化 Pino 日志记录器服务。
   * 根据配置参数创建或使用已存在的日志记录器实例，并设置上下文名称和错误键名。
   *
   * @param pinoHttp - 配置参数对象，包含 pinoHttp 和 renameContext 字段
   * @param pinoHttp.pinoHttp - Pino HTTP 配置选项，用于创建日志记录器实例
   * @param pinoHttp.renameContext - 自定义上下文字段名称
   */
  constructor(
    @Inject(PARAMS_PROVIDER_TOKEN) { pinoHttp, renameContext }: Params,
  ) {
    if (
      typeof pinoHttp === 'object' &&
      'customAttributeKeys' in pinoHttp &&
      typeof pinoHttp.customAttributeKeys !== 'undefined'
    ) {
      this.errorKey = pinoHttp.customAttributeKeys.err ?? 'err';
    }

    if (!outOfContext) {
      if (Array.isArray(pinoHttp)) {
        outOfContext = pino(...(pinoHttp as any)) as any;
      } else if (isPassedLogger(pinoHttp)) {
        outOfContext = pinoHttp.logger as any;
      } else if (
        typeof pinoHttp === 'object' &&
        'stream' in pinoHttp &&
        typeof pinoHttp.stream !== 'undefined'
      ) {
        outOfContext = pino(pinoHttp as any, pinoHttp.stream) as any;
      } else {
        outOfContext = pino(pinoHttp as any) as any;
      }
    }

    this.contextName = renameContext || 'context';
  }

  /**
   * 获取当前日志记录器实例
   *
   * @description 优先返回请求作用域内的日志记录器实例，如果不在请求作用域内，
   * 则返回请求上下文外的日志记录器实例。
   * 在运行时，outOfContext 总是会被设置，因此可以安全地使用非空断言。
   *
   * @returns 当前可用的 Pino 日志记录器实例
   */
  get logger(): pino.Logger {
    // outOfContext is always set in runtime before starts using

    return (storage.getStore()?.logger || outOfContext!) as any;
  }

  /**
   * 记录跟踪级别日志（字符串消息）
   *
   * @description 记录跟踪级别的日志信息，用于非常详细的调试信息。
   *
   * @param msg - 日志消息字符串
   * @param args - 额外的参数，会传递给 Pino 日志记录器
   */
  trace(msg: string, ...args: any[]): void;
  /**
   * 记录跟踪级别日志（对象消息）
   *
   * @description 记录跟踪级别的日志信息，使用对象形式的消息。
   *
   * @param obj - 日志消息对象
   * @param msg - 可选的日志消息字符串
   * @param args - 额外的参数，会传递给 Pino 日志记录器
   */
  trace(obj: unknown, msg?: string, ...args: any[]): void;
  /**
   * 记录跟踪级别日志（实现）
   *
   * @description 内部实现方法，根据参数类型自动选择正确的重载。
   *
   * @param args - 日志参数，可能是字符串消息或对象消息
   *
   * @internal
   */
  trace(...args: Parameters<LoggerFn>) {
    this.call('trace', ...args);
  }

  /**
   * 记录调试级别日志（字符串消息）
   *
   * @param msg - 日志消息字符串
   * @param args - 额外的参数
   */
  debug(msg: string, ...args: any[]): void;
  /**
   * 记录调试级别日志（对象消息）
   *
   * @param obj - 日志消息对象
   * @param msg - 可选的日志消息字符串
   * @param args - 额外的参数
   */
  debug(obj: unknown, msg?: string, ...args: any[]): void;
  /**
   * 记录调试级别日志（实现）
   *
   * @internal
   */
  debug(...args: Parameters<LoggerFn>) {
    this.call('debug', ...args);
  }

  /**
   * 记录信息级别日志（字符串消息）
   *
   * @param msg - 日志消息字符串
   * @param args - 额外的参数
   */
  info(msg: string, ...args: any[]): void;
  /**
   * 记录信息级别日志（对象消息）
   *
   * @param obj - 日志消息对象
   * @param msg - 可选的日志消息字符串
   * @param args - 额外的参数
   */
  info(obj: unknown, msg?: string, ...args: any[]): void;
  /**
   * 记录信息级别日志（实现）
   *
   * @internal
   */
  info(...args: Parameters<LoggerFn>) {
    this.call('info', ...args);
  }

  /**
   * 记录警告级别日志（字符串消息）
   *
   * @param msg - 日志消息字符串
   * @param args - 额外的参数
   */
  warn(msg: string, ...args: any[]): void;
  /**
   * 记录警告级别日志（对象消息）
   *
   * @param obj - 日志消息对象
   * @param msg - 可选的日志消息字符串
   * @param args - 额外的参数
   */
  warn(obj: unknown, msg?: string, ...args: any[]): void;
  /**
   * 记录警告级别日志（实现）
   *
   * @internal
   */
  warn(...args: Parameters<LoggerFn>) {
    this.call('warn', ...args);
  }

  /**
   * 记录错误级别日志（字符串消息）
   *
   * @param msg - 日志消息字符串
   * @param args - 额外的参数
   */
  error(msg: string, ...args: any[]): void;
  /**
   * 记录错误级别日志（对象消息）
   *
   * @param obj - 日志消息对象
   * @param msg - 可选的日志消息字符串
   * @param args - 额外的参数
   */
  error(obj: unknown, msg?: string, ...args: any[]): void;
  /**
   * 记录错误级别日志（实现）
   *
   * @internal
   */
  error(...args: Parameters<LoggerFn>) {
    this.call('error', ...args);
  }

  /**
   * 记录致命错误级别日志（字符串消息）
   *
   * @param msg - 日志消息字符串
   * @param args - 额外的参数
   */
  fatal(msg: string, ...args: any[]): void;
  /**
   * 记录致命错误级别日志（对象消息）
   *
   * @param obj - 日志消息对象
   * @param msg - 可选的日志消息字符串
   * @param args - 额外的参数
   */
  fatal(obj: unknown, msg?: string, ...args: any[]): void;
  /**
   * 记录致命错误级别日志（实现）
   *
   * @internal
   */
  fatal(...args: Parameters<LoggerFn>) {
    this.call('fatal', ...args);
  }

  /**
   * 设置日志上下文名称
   *
   * @description 设置当前日志记录器的上下文名称。
   * 上下文名称会作为字段添加到所有后续的日志记录中，用于标识日志来源。
   *
   * @param value - 上下文名称字符串
   *
   * @example
   * ```typescript
   * this.logger.setContext('UserService');
   * this.logger.info('用户创建成功'); // 日志中会包含 context: 'UserService'
   * ```
   */
  setContext(value: string) {
    this.context = value;
  }

  /**
   * 为当前请求作用域内的日志记录器绑定字段
   *
   * @description 为当前请求作用域内的日志记录器绑定额外的字段。
   * 绑定的字段会自动添加到该请求的所有后续日志记录中。
   * 此方法只能在请求处理过程中调用，如果在请求作用域外调用会抛出错误。
   *
   * @param fields - 要绑定的字段对象
   * @throws {Error} 如果在请求作用域外调用此方法
   *
   * @example
   * ```typescript
   * // 在请求处理过程中绑定用户 ID
   * this.logger.assign({ userId: 123, requestId: 'req-456' });
   * this.logger.info('处理请求'); // 日志中会自动包含 userId 和 requestId
   * ```
   */
  assign(fields: pino.Bindings) {
    const store = storage.getStore();
    if (!store) {
      throw new Error(
        `${PinoLogger.name}: unable to assign extra fields out of request scope`,
      );
    }
    store.logger = store.logger.child(fields);
    store.responseLogger?.setBindings(fields);
  }

  /**
   * 内部日志调用方法
   *
   * @description 统一处理所有日志级别的调用逻辑。
   * 如果设置了上下文，会自动将上下文信息添加到日志记录中。
   * 对于 Error 对象，会使用自定义的错误键名进行存储。
   *
   * @param method - 日志级别（trace, debug, info, warn, error, fatal）
   * @param args - 日志参数，可能是字符串消息或对象消息
   *
   * @internal
   */
  protected call(method: pino.Level, ...args: Parameters<LoggerFn>) {
    if (this.context) {
      if (isFirstArgObject(args)) {
        const firstArg = args[0];
        if (firstArg instanceof Error) {
          args = [
            Object.assign(
              { [this.contextName]: this.context },
              { [this.errorKey]: firstArg },
            ),
            ...args.slice(1),
          ];
        } else {
          args = [
            Object.assign({ [this.contextName]: this.context }, firstArg),
            ...args.slice(1),
          ];
        }
      } else {
        args = [{ [this.contextName]: this.context }, ...args];
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore args are union of tuple types
    this.logger[method](...args);
  }
}

/**
 * 检查第一个参数是否为对象
 *
 * @description 类型守卫函数，用于判断日志调用的第一个参数是否为对象类型。
 * 如果是对象，则使用对象形式的日志调用；否则使用字符串形式的日志调用。
 *
 * @param args - 日志参数数组
 * @returns 如果第一个参数是对象，返回 true；否则返回 false
 *
 * @internal
 */
function isFirstArgObject(
  args: Parameters<LoggerFn>,
): args is [obj: object, msg?: string, ...args: any[]] {
  return typeof args[0] === 'object';
}
