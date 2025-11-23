import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import type {
  ApiErrorResponse,
  ApiRequestConfig,
  ApiResponse,
} from './api-client.types'
import { authService } from './services/auth.service'

/**
 * 获取设备信息
 * 从浏览器 navigator 对象中提取设备相关信息
 *
 * @returns 设备信息对象
 */
function getDeviceInfo() {
  const ua = navigator.userAgent
  const platform = navigator.platform

  // 检测设备类型
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  const isTablet = /iPad|Android/i.test(ua) && !isMobile
  let deviceType = 'desktop'
  if (isMobile) deviceType = 'mobile'
  else if (isTablet) deviceType = 'tablet'

  // 检测浏览器
  let browser = 'unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'

  // 检测操作系统
  let deviceOs = 'unknown'
  if (ua.includes('Windows')) deviceOs = 'Windows'
  else if (ua.includes('Mac')) deviceOs = 'macOS'
  else if (ua.includes('Linux')) deviceOs = 'Linux'
  else if (ua.includes('Android')) deviceOs = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad'))
    deviceOs = 'iOS'

  return {
    device_type: deviceType,
    device_os: deviceOs,
    browser,
    userAgent: ua,
    device_name: `${deviceOs} ${browser}`,
  }
}

/**
 * 是否正在刷新令牌
 * 用于防止并发刷新请求
 */
let isRefreshing = false

/**
 * 待重试的请求队列
 * 在令牌刷新完成后重试这些请求
 */
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (error?: unknown) => void
}> = []

/**
 * 处理待重试的请求队列
 */
function processQueue(error: unknown | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

/**
 * 创建并配置 axios 实例
 * 配置基础 URL、超时时间、请求/响应拦截器等
 */
const apiClient: AxiosInstance = axios.create({
  /**
   * API 基础地址
   * 从环境变量读取，如果未设置则使用默认值
   */
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  /**
   * 请求超时时间（毫秒）
   */
  timeout: 30000,
  /**
   * 是否携带凭证（Cookie）
   */
  withCredentials: true,
  /**
   * 默认请求头
   */
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * 请求拦截器
 * 在发送请求前自动添加认证令牌和设备信息
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从认证状态中获取访问令牌
    const accessToken = useAuthStore.getState().auth.accessToken

    // 如果有访问令牌，添加到请求头
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    // 如果是登录请求，添加设备信息到请求体
    // 注意：这里只处理 POST 请求，且 URL 包含 sign-in
    if (
      config.method === 'post' &&
      config.url?.includes('sign-in') &&
      config.data
    ) {
      const deviceInfo = getDeviceInfo()
      config.data = {
        ...config.data,
        ...deviceInfo,
      }
    }

    // 开发环境下输出请求信息以便调试
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        headers: config.headers,
      })
    }

    return config
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * 统一处理响应数据格式和错误，实现自动令牌刷新
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 获取请求配置
    const config = response.config as AxiosRequestConfig & ApiRequestConfig

    // 如果设置了跳过数据提取，返回完整响应
    if (config.skipDataExtraction) {
      return response
    }

    // 适配后端响应格式：提取 response.data.data
    // 后端返回格式：{ message: string, data: T }
    if (response.data && 'data' in response.data) {
      return {
        ...response,
        data: response.data.data,
      }
    }

    // 如果没有 data 字段，返回原始响应
    return response
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // 获取请求配置
    const config = error.config as AxiosRequestConfig & ApiRequestConfig

    // 如果设置了跳过错误处理，直接返回错误
    if (config.skipErrorHandling) {
      return Promise.reject(error)
    }

    // 处理 401 未授权错误（自动刷新令牌）
    if (error.response?.status === 401) {
      const originalRequest = config

      // 如果已经在刷新令牌，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            // 重试原始请求
            const newAccessToken = useAuthStore.getState().auth.accessToken
            if (newAccessToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      // 开始刷新令牌
      isRefreshing = true

      const authState = useAuthStore.getState().auth
      const { user, refreshToken, sessionToken } = authState

      // 检查是否有刷新令牌和用户信息
      if (!refreshToken || !sessionToken || !user) {
        // 没有刷新令牌，清除状态并跳转登录页
        authState.reset()
        processQueue(new Error('未授权，请重新登录'))
        isRefreshing = false

        // 跳转到登录页（需要延迟以避免在拦截器中直接导航）
        setTimeout(() => {
          window.location.href = '/sign-in'
        }, 100)

        return Promise.reject(error)
      }

      try {
        // 调用刷新令牌 API
        const response = await authService.refreshToken({
          user_id: user.id,
          session_token: sessionToken,
        })

        // 更新令牌
        authState.setTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          session_token: response.session_token,
        })

        // 更新原始请求的 Authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${response.access_token}`
        }

        // 处理队列中的请求
        processQueue(null)
        isRefreshing = false

        // 重试原始请求
        return apiClient(originalRequest)
      } catch (refreshError) {
        // 刷新令牌失败，清除状态
        authState.reset()
        processQueue(refreshError)
        isRefreshing = false

        // 跳转到登录页
        setTimeout(() => {
          window.location.href = '/sign-in'
        }, 100)

        return Promise.reject(refreshError)
      }
    }

    // 处理其他类型的错误
    if (error.response) {
      // 服务器返回了错误响应
      // 由全局错误处理器统一处理
    } else if (error.request) {
      // 请求已发送但没有收到响应
      // 可能是网络错误、服务器无响应或 CORS 问题
      const baseURL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const requestUrl = error.config?.url
        ? `${error.config.baseURL}${error.config.url}`
        : baseURL

      // 开发环境下输出详细错误信息
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('API Request Failed:', {
          url: requestUrl,
          method: error.config?.method?.toUpperCase(),
          baseURL: error.config?.baseURL,
          error: error.message,
          request: error.request,
          frontendOrigin: window.location.origin,
        })
      }

      error.message = `网络错误：无法连接到服务器 ${requestUrl}。请检查：
1. 后端服务是否已启动（${baseURL}）
2. CORS 配置是否正确（允许来源：${window.location.origin}）
3. 网络连接是否正常`
    } else {
      // 请求配置错误
      error.message = '请求配置错误'
    }

    return Promise.reject(error)
  }
)

/**
 * 导出配置好的 axios 实例
 * 在应用中使用此实例进行所有 API 调用
 *
 * @example
 * ```ts
 * import { apiClient } from '@/lib/api-client'
 *
 * // GET 请求
 * const users = await apiClient.get('/users')
 *
 * // POST 请求
 * const result = await apiClient.post('/auth/sign-in', { email, password })
 * ```
 */
export { apiClient }

/**
 * 导出设备信息获取函数（供外部使用）
 */
export { getDeviceInfo }
