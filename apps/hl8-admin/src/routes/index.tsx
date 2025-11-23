import { createFileRoute } from '@tanstack/react-router'
import { Landing } from '@/features/landing'

/**
 * Landing Page 路由
 * 应用的首页，所有用户都可以访问
 */
export const Route = createFileRoute('/')({
  component: Landing,
})
