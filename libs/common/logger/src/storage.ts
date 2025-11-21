import { AsyncLocalStorage } from 'async_hooks';

import type { Logger } from 'pino';

/**
 * 日志存储类
 *
 * @description 用于在异步本地存储中保存日志记录器实例。
 * 每个请求会创建一个 Store 实例，用于存储该请求的日志记录器和响应日志记录器。
 *
 * 主要用途：
 * - 在请求处理过程中维护请求级别的日志上下文
 * - 支持请求作用域内的日志字段绑定
 * - 确保日志记录包含正确的请求信息
 *
 * @example
 * ```typescript
 * // 在请求处理过程中
 * const store = new Store(logger, responseLogger);
 * storage.run(store, () => {
 *   // 在此作用域内的所有日志都会使用 store.logger
 * });
 * ```
 */
export class Store {
  /**
   * 构造函数
   *
   * @description 创建一个日志存储实例。
   *
   * @param logger - 请求日志记录器实例，用于记录应用日志
   * @param responseLogger - 响应日志记录器实例，可选，用于记录响应日志
   */
  constructor(
    public logger: Logger,
    public responseLogger?: Logger,
  ) {}
}

/**
 * 异步本地存储实例
 *
 * @description 使用 Node.js 的 AsyncLocalStorage API 实现的异步本地存储。
 * 用于在请求处理过程中维护请求级别的日志上下文，确保在异步操作中也能正确访问日志记录器。
 *
 * 主要特性：
 * - 自动管理请求级别的上下文隔离
 * - 支持嵌套异步操作
 * - 线程安全，每个请求都有独立的存储空间
 *
 * @example
 * ```typescript
 * // 在中间件中设置存储
 * storage.run(new Store(logger), () => {
 *   // 在服务中获取日志记录器
 *   const store = storage.getStore();
 *   store?.logger.info('处理请求');
 * });
 * ```
 */
export const storage = new AsyncLocalStorage<Store>();
