import { Inject, Provider } from '@nestjs/common';

import { PinoLogger } from './PinoLogger.js';

/**
 * 装饰器令牌前缀
 *
 * @description 用于生成依赖注入令牌的前缀字符串。
 * 格式：`PinoLogger:${context}`
 *
 * @internal
 */
const decoratedTokenPrefix = 'PinoLogger:';

/**
 * 已注册的上下文集合
 *
 * @description 用于跟踪所有通过装饰器注册的日志上下文。
 * 在模块初始化时，会为每个已注册的上下文创建对应的提供者。
 *
 * @internal
 */
const decoratedLoggers = new Set<string>();

/**
 * Pino 日志记录器依赖注入装饰器
 *
 * @description 用于在类构造函数中注入已配置上下文的 Pino 日志记录器实例。
 * 使用此装饰器可以自动设置日志上下文，无需手动调用 setContext 方法。
 *
 * @param context - 日志上下文名称，默认为空字符串
 * @returns NestJS Inject 装饰器，用于参数注入
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     // 自动注入已配置上下文的日志记录器
 *     @InjectPinoLogger('UserService') private readonly logger: PinoLogger
 *   ) {}
 *
 *   async createUser(userData: CreateUserDto) {
 *     // 日志中会自动包含 context: 'UserService'
 *     this.logger.info('创建用户', { userId: userData.id });
 *   }
 * }
 * ```
 */
export function InjectPinoLogger(context = '') {
  decoratedLoggers.add(context);
  return Inject(getLoggerToken(context));
}

/**
 * 创建装饰器日志记录器提供者
 *
 * @description 为指定的上下文创建一个日志记录器提供者。
 * 该提供者会在注入时自动设置日志上下文。
 *
 * @param context - 日志上下文名称
 * @returns NestJS 提供者配置对象
 *
 * @internal
 */
function createDecoratedLoggerProvider(context: string): Provider<PinoLogger> {
  return {
    provide: getLoggerToken(context),
    useFactory: (logger: PinoLogger) => {
      logger.setContext(context);
      return logger;
    },
    inject: [PinoLogger],
  };
}

/**
 * 为所有已注册的装饰器创建提供者
 *
 * @description 为所有通过 InjectPinoLogger 装饰器注册的上下文创建对应的提供者。
 * 这些提供者会在 LoggerModule 初始化时被创建和注册。
 *
 * @returns 日志记录器提供者数组
 *
 * @example
 * ```typescript
 * // 在 LoggerModule 中使用
 * const decorated = createProvidersForDecorated();
 * // 返回所有已注册上下文的提供者列表
 * ```
 *
 * @internal
 */
export function createProvidersForDecorated(): Array<Provider<PinoLogger>> {
  return [...decoratedLoggers.values()].map(createDecoratedLoggerProvider);
}

/**
 * 获取日志记录器依赖注入令牌
 *
 * @description 根据上下文名称生成对应的依赖注入令牌。
 * 令牌格式：`PinoLogger:${context}`
 *
 * @param context - 日志上下文名称
 * @returns 依赖注入令牌字符串
 *
 * @example
 * ```typescript
 * getLoggerToken('UserService'); // 返回 'PinoLogger:UserService'
 * getLoggerToken(''); // 返回 'PinoLogger:'
 * ```
 */
export function getLoggerToken(context: string): string {
  return `${decoratedTokenPrefix}${context}`;
}
