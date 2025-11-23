import { Link } from '@tanstack/react-router'
import { ArrowRight, Shield, Zap, Users, LayoutDashboard } from 'lucide-react'
import { Logo } from '@/assets/logo'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'

/**
 * Landing Page 组件
 * 应用的首页，展示产品特性和引导用户注册/登录
 */
export function Landing() {
  const { auth } = useAuthStore()
  const isAuthenticated = auth.isAuthenticated()

  return (
    <div className='flex min-h-screen flex-col'>
      {/* Header */}
      <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur'>
        <div className='container flex h-16 items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Logo className='size-6' />
            <span className='text-lg font-bold'>HL8 Admin</span>
          </div>
          <nav className='flex items-center gap-4'>
            {isAuthenticated ? (
              <>
                <Link
                  to='/apps'
                  className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
                >
                  控制台
                </Link>
                <Button asChild>
                  <Link to='/apps'>
                    <LayoutDashboard className='mr-2 size-4' />
                    进入管理后台
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Link
                  to='/sign-in'
                  className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
                >
                  登录
                </Link>
                <Button asChild>
                  <Link to='/sign-up'>
                    注册
                    <ArrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className='container flex flex-col items-center justify-center gap-8 py-24 text-center'>
        <div className='flex max-w-3xl flex-col gap-6'>
          <h1 className='text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
            现代化的管理平台
            <br />
            <span className='text-primary'>为您的业务赋能</span>
          </h1>
          <p className='text-muted-foreground text-lg sm:text-xl'>
            HL8 Admin 是一个功能强大、易于使用的管理后台系统，
            帮助您高效管理业务数据和用户信息。
          </p>
          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
            {isAuthenticated ? (
              <Button size='lg' asChild>
                <Link to='/apps'>
                  <LayoutDashboard className='mr-2 size-4' />
                  进入管理后台
                </Link>
              </Button>
            ) : (
              <>
                <Button size='lg' asChild>
                  <Link to='/sign-up'>
                    免费开始
                    <ArrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' asChild>
                  <Link to='/sign-in'>已有账户？登录</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='bg-muted/50 border-t py-24'>
        <div className='container'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
              为什么选择 HL8 Admin？
            </h2>
            <p className='text-muted-foreground mt-4 text-lg'>
              我们提供您所需的一切功能，让管理变得简单高效
            </p>
          </div>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            <FeatureCard
              icon={<Zap className='size-6' />}
              title='极速性能'
              description='基于最新的技术栈构建，提供流畅的用户体验和快速的响应速度'
            />
            <FeatureCard
              icon={<Shield className='size-6' />}
              title='安全可靠'
              description='采用行业标准的安全措施，保护您的数据安全'
            />
            <FeatureCard
              icon={<Users className='size-6' />}
              title='用户友好'
              description='直观的界面设计，让您和您的团队轻松上手'
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='container py-24'>
        <div className='bg-card rounded-lg border p-8 text-center shadow-sm'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            准备开始了吗？
          </h2>
          <p className='text-muted-foreground mt-4 text-lg'>
            立即注册，体验强大的管理功能
          </p>
          <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
            {isAuthenticated ? (
              <Button size='lg' asChild>
                <Link to='/apps'>
                  <LayoutDashboard className='mr-2 size-4' />
                  进入管理后台
                </Link>
              </Button>
            ) : (
              <>
                <Button size='lg' asChild>
                  <Link to='/sign-up'>
                    免费注册
                    <ArrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' asChild>
                  <Link to='/sign-in'>登录账户</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-muted/50 border-t py-12'>
        <div className='container'>
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <div className='flex items-center gap-2'>
              <Logo className='size-5' />
              <span className='text-sm font-medium'>HL8 Admin</span>
            </div>
            <p className='text-muted-foreground text-sm'>
              © {new Date().getFullYear()} HL8 Admin. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * 特性卡片组件
 */
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className='bg-card rounded-lg border p-6 shadow-sm'>
      <div className='bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-lg'>
        {icon}
      </div>
      <h3 className='mb-2 text-xl font-semibold'>{title}</h3>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  )
}
