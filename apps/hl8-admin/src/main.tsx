import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// 生成的路由树
import { routeTree } from './routeTree.gen'
// 样式文件
import './styles/index.css'

/**
 * 创建 QueryClient 实例
 * 配置 React Query 的默认选项和错误处理
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * 重试逻辑
       * 开发环境：不重试
       * 生产环境：最多重试 3 次，但 401/403 错误不重试
       */
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      // 生产环境在窗口获得焦点时重新获取数据
      refetchOnWindowFocus: import.meta.env.PROD,
      // 数据过期时间：10 秒
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      /**
       * 变更操作的错误处理
       * 统一处理服务器错误，特殊处理 304 状态码
       */
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('内容未修改！')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    /**
     * 查询缓存的全局错误处理
     * 处理认证错误（401）、服务器错误（500）和权限错误（403）
     */
    onError: (error) => {
      if (error instanceof AxiosError) {
        // 会话过期，跳转到登录页
        if (error.response?.status === 401) {
          toast.error('会话已过期！')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        // 服务器内部错误
        if (error.response?.status === 500) {
          toast.error('服务器内部错误！')
          // 仅在生产环境跳转到错误页面，避免在开发环境干扰 HMR
          if (import.meta.env.PROD) {
            router.navigate({ to: '/500' })
          }
        }
        // 权限不足（403）
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

/**
 * 创建路由实例
 * 配置路由树、上下文和预加载策略
 */
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

/**
 * 注册路由实例以支持类型安全
 * 扩展 TanStack Router 的类型定义
 */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

/**
 * 渲染应用
 * 获取根元素并渲染 React 应用
 */
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
