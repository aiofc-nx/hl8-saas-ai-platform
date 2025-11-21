/**
 * @description 错误类型解析器，用于生成符合 RFC7807 的 type 字段
 */

/**
 * @description 错误类型配置选项
 */
export interface ErrorTypeConfig {
  /**
   * @description 基础 URL，用于构建错误文档链接
   * @example 'https://api.example.com/docs/errors'
   */
  baseUrl?: string;

  /**
   * @description 错误码到文档路径的映射
   * @example { 'USER_NOT_FOUND': '/user-not-found', 'INVALID_EMAIL': '/validation/invalid-email' }
   */
  errorCodeMap?: Record<string, string>;

  /**
   * @description 默认错误文档路径
   * @default '/general'
   */
  defaultPath?: string;
}

let globalConfig: ErrorTypeConfig | undefined;

/**
 * @description 配置全局错误类型解析器
 * @param config - 错误类型配置
 * @example
 * ```typescript
 * configureErrorTypeResolver({
 *   baseUrl: 'https://api.example.com/docs/errors',
 *   errorCodeMap: {
 *     'USER_NOT_FOUND': '/user-not-found',
 *     'INVALID_EMAIL': '/validation/invalid-email',
 *   },
 *   defaultPath: '/general',
 * });
 * ```
 */
export function configureErrorTypeResolver(config: ErrorTypeConfig): void {
  globalConfig = config;
}

/**
 * @description 解析错误类型 URL
 * @param errorCode - 业务错误码
 * @param customType - 自定义类型 URL，优先级最高
 * @returns 符合 RFC7807 的 type 字段值
 * @example
 * ```typescript
 * // 使用全局配置
 * resolveErrorType('USER_NOT_FOUND');
 * // => 'https://api.example.com/docs/errors/user-not-found'
 *
 * // 使用自定义类型
 * resolveErrorType('USER_NOT_FOUND', 'https://custom.com/error');
 * // => 'https://custom.com/error'
 *
 * // 无配置时返回默认值
 * resolveErrorType('UNKNOWN');
 * // => 'about:blank'
 * ```
 */
export function resolveErrorType(
  errorCode?: string,
  customType?: string,
): string {
  // 优先级 1: 自定义类型
  if (customType) {
    return customType;
  }

  // 优先级 2: 使用全局配置
  if (globalConfig && errorCode) {
    const { baseUrl, errorCodeMap, defaultPath } = globalConfig;

    if (baseUrl) {
      // 查找错误码映射
      const mappedPath = errorCodeMap?.[errorCode];
      const path = mappedPath ?? defaultPath ?? '/general';

      return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }
  }

  // 优先级 3: 默认值
  return 'about:blank';
}

/**
 * @description 重置全局配置（主要用于测试）
 */
export function resetErrorTypeResolver(): void {
  globalConfig = undefined;
}
