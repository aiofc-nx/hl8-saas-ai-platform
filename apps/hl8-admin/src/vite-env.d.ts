/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 * 为 TypeScript 提供环境变量的类型支持
 */
interface ImportMetaEnv {
  /**
   * API 基础地址
   * 后端服务的基础 URL，例如：http://localhost:8000
   */
  readonly VITE_API_BASE_URL: string

  /**
   * 应用环境
   * 可选值：development, production
   */
  readonly VITE_APP_ENV: 'development' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
