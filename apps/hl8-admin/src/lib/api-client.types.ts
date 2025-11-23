/**
 * API 客户端类型定义
 * 定义与后端 API 交互相关的 TypeScript 类型
 */

/**
 * 后端 API 标准响应格式
 * 所有 API 响应都遵循此格式
 *
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T = unknown> {
  /**
   * 响应消息
   */
  message: string
  /**
   * 响应数据
   */
  data: T
}

/**
 * 后端 API 错误响应格式
 * 当请求失败时返回的错误信息
 */
export interface ApiErrorResponse {
  /**
   * 错误状态码
   */
  statusCode?: number
  /**
   * 错误消息
   */
  message?: string | string[]
  /**
   * 错误标题（部分错误可能包含）
   */
  title?: string
  /**
   * 错误详情（验证错误时可能包含字段级别的错误）
   */
  errors?: Record<string, string[]>
  /**
   * 错误码（业务错误码）
   */
  errorCode?: string
}

/**
 * API 客户端请求配置
 * 扩展 axios 的请求配置
 */
export interface ApiRequestConfig {
  /**
   * 是否跳过响应数据提取（默认会自动提取 response.data.data）
   * 设置为 true 时，返回完整的响应对象
   */
  skipDataExtraction?: boolean
  /**
   * 是否跳过错误处理（默认会自动处理错误）
   * 设置为 true 时，需要手动处理错误
   */
  skipErrorHandling?: boolean
}

/**
 * 扩展 AxiosRequestConfig 以支持自定义配置
 */
declare module 'axios' {
  export interface AxiosRequestConfig extends ApiRequestConfig {}
}

/**
 * 设备信息接口
 * 用于登录时追踪用户设备信息
 */
export interface DeviceInfo {
  /**
   * IP 地址
   */
  ip?: string
  /**
   * 地理位置
   */
  location?: string
  /**
   * 设备名称
   */
  device_name?: string
  /**
   * 设备操作系统
   */
  device_os?: string
  /**
   * 设备类型（mobile/desktop/tablet）
   */
  device_type?: string
  /**
   * 浏览器名称
   */
  browser?: string
  /**
   * 用户代理字符串
   */
  userAgent?: string
}
