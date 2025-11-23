/**
 * @fileoverview 日志提供者
 * @description 集成 @hl8/logger 提供统一日志输出，支持依赖注入
 *
 * ## 业务规则
 *
 * ### 日志输出规则
 * - 使用 @hl8/logger 提供的日志服务
 * - 支持结构化日志输出
 * - 支持日志级别控制
 * - 支持日志上下文传递
 *
 * ### 日志格式规则
 * - 统一日志格式，包含时间戳、级别、消息、上下文等信息
 * - 支持日志脱敏，自动过滤敏感信息
 * - 支持日志聚合，便于日志分析和审计
 *
 * ### 日志级别规则
 * - error：错误日志，记录系统错误和异常
 * - warn：警告日志，记录警告信息
 * - info：信息日志，记录重要业务信息
 * - debug：调试日志，记录调试信息
 * - trace：跟踪日志，记录详细跟踪信息
 */

/**
 * @fileoverview 日志提供者
 * @description 集成 @hl8/logger 提供统一日志输出，支持依赖注入
 *
 * ## 业务规则
 *
 * ### 日志输出规则
 * - 使用 @hl8/logger 提供的日志服务
 * - 支持结构化日志输出
 * - 支持日志级别控制
 * - 支持日志上下文传递
 *
 * ### 日志格式规则
 * - 统一日志格式，包含时间戳、级别、消息、上下文等信息
 * - 支持日志脱敏，自动过滤敏感信息
 * - 支持日志聚合，便于日志分析和审计
 *
 * ### 日志级别规则
 * - error：错误日志，记录系统错误和异常
 * - warn：警告日志，记录警告信息
 * - info：信息日志，记录重要业务信息
 * - debug：调试日志，记录调试信息
 * - trace：跟踪日志，记录详细跟踪信息
 *
 * **注意**：此模块已被废弃。`PinoLoggingModule` 现在直接提供 `Logger` 别名，
 * 无需通过此模块进行转换。请直接使用 `PinoLoggingModule.forRoot()` 并在需要的地方注入 `Logger`。
 */

import { Global, Module } from '@nestjs/common';

/**
 * @description 日志模块（已废弃）
 * @remarks 此模块已被废弃，因为 `PinoLoggingModule` 现在直接提供 `Logger` 别名。
 * 请直接使用 `PinoLoggingModule.forRoot()` 并在需要的地方注入 `Logger`。
 *
 * 此模块保留仅为向后兼容，实际上不执行任何操作。
 *
 * @deprecated 请直接使用 `PinoLoggingModule.forRoot()`，无需通过此模块
 */
@Global()
@Module({
  // 此模块不再提供任何提供者，因为 PinoLoggingModule 已经提供了 Logger 别名
  // 保留此模块仅为向后兼容
})
export class LoggingModule {}
