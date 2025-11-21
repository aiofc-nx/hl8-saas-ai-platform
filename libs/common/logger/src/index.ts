/**
 * @hl8/logger
 *
 * @description 企业级日志基础设施模块，基于 Pino 提供高性能日志记录功能。
 *
 * 主要功能：
 * - 自动 HTTP 请求/响应日志记录
 * - 支持同步和异步配置
 * - 请求上下文管理和作用域隔离
 * - 与 NestJS 异常处理器兼容
 * - 支持装饰器注入日志实例
 * - 完整的类型安全支持
 *
 * @example
 * ```typescript
 * import { LoggerModule, Logger, PinoLogger } from '@hl8/logger';
 *
 * // 在模块中导入
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
 * // 在服务中使用
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly logger: Logger) {}
 *
 *   async createUser(userData: CreateUserDto) {
 *     this.logger.log('创建用户', 'UserService');
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */

export { InjectPinoLogger, getLoggerToken } from './InjectPinoLogger.js';
export { Logger } from './Logger.js';
export { LoggerErrorInterceptor } from './LoggerErrorInterceptor.js';
export { LoggerModule } from './LoggerModule.js';
export { PARAMS_PROVIDER_TOKEN } from './params.js';
export type { LoggerModuleAsyncParams, Params } from './params.js';
export { PinoLogger } from './PinoLogger.js';
