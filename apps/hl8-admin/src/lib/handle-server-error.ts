import { AxiosError } from 'axios'
import { toast } from 'sonner'
import type { ApiErrorResponse } from './api-client.types'

/**
 * 处理服务器错误
 * 统一处理应用中的服务器错误，提取错误信息并显示给用户
 *
 * @param error - 未知类型的错误对象，可能是 AxiosError 或其他错误类型
 *
 * @remarks
 * 错误处理逻辑：
 * 1. 首先检查是否为状态码 204（内容未找到）
 * 2. 如果是 AxiosError，根据不同的 HTTP 状态码提取相应的错误信息
 * 3. 适配后端错误响应格式（ApiErrorResponse）
 * 4. 如果无法提取具体错误信息，使用默认错误消息
 * 5. 使用 toast 显示错误消息给用户
 *
 * 支持的错误状态码：
 * - 400: 验证错误，显示后端返回的详细错误信息
 * - 401: 未授权，显示会话过期消息
 * - 403: 权限不足，显示权限错误消息
 * - 404: 资源不存在，显示未找到消息
 * - 500: 服务器错误，显示服务器错误消息
 * - 其他: 显示通用错误消息
 *
 * @example
 * ```ts
 * try {
 *   await apiClient.get('/users')
 * } catch (error) {
 *   handleServerError(error)
 * }
 * ```
 */
export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = '出错了！'

  // 处理非 AxiosError 的错误
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = '内容未找到。'
    toast.error(errMsg)
    return
  }

  // 处理 AxiosError
  if (error instanceof AxiosError) {
    const response = error.response
    const errorData = response?.data as ApiErrorResponse | undefined

    if (response) {
      const status = response.status

      switch (status) {
        case 400:
          // 验证错误
          if (errorData) {
            // 处理字段级别的验证错误
            if (errorData.errors) {
              const firstError = Object.values(errorData.errors)[0]
              errMsg = Array.isArray(firstError)
                ? firstError[0]
                : '请求参数验证失败'
            } else if (errorData.message) {
              // 处理消息数组或字符串
              errMsg = Array.isArray(errorData.message)
                ? errorData.message[0]
                : errorData.message
            } else if (errorData.title) {
              errMsg = errorData.title
            } else {
              errMsg = '请求参数错误'
            }
          } else {
            errMsg = '请求参数错误'
          }
          break

        case 401:
          // 未授权（会话过期）
          errMsg = errorData?.message
            ? Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
            : '会话已过期，请重新登录'
          break

        case 403:
          // 权限不足
          errMsg = errorData?.message
            ? Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
            : '权限不足，无法执行此操作'
          break

        case 404:
          // 资源不存在
          errMsg = errorData?.message
            ? Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
            : '请求的资源不存在'
          break

        case 500:
          // 服务器内部错误
          errMsg = errorData?.message
            ? Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
            : '服务器内部错误，请稍后重试'
          break

        default:
          // 其他错误
          if (errorData) {
            if (errorData.message) {
              errMsg = Array.isArray(errorData.message)
                ? errorData.message[0]
                : errorData.message
            } else if (errorData.title) {
              errMsg = errorData.title
            } else {
              errMsg = `请求失败（状态码：${status}）`
            }
          } else {
            errMsg = `请求失败（状态码：${status}）`
          }
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应（网络错误）
      // 可能是后端服务未启动、CORS 配置错误或网络问题
      const baseURL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      errMsg = `网络错误，无法连接到服务器。请检查：
1. 后端服务是否已启动（${baseURL}）
2. 网络连接是否正常
3. CORS 配置是否正确`
    } else {
      // 请求配置错误
      errMsg = error.message || '请求配置错误'
    }
  }

  toast.error(errMsg)
}
