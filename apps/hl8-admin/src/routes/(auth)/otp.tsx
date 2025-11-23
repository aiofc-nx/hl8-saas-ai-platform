import { createFileRoute } from '@tanstack/react-router'
import { Otp } from '@/features/auth/otp'

/**
 * OTP 验证页面路由
 * 支持通过 search 参数传递 email
 */
export const Route = createFileRoute('/(auth)/otp')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      email: (search.email as string) || '',
    }
  },
  component: Otp,
})
