import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { IconFacebook, IconGithub } from '@/assets/brand-icons'
import { handleServerError } from '@/lib/handle-server-error'
import { authService } from '@/lib/services/auth.service'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z
  .object({
    email: z.string().min(1, '请输入邮箱地址').email('请输入有效的邮箱地址'),
    password: z.string().min(1, '请输入密码').min(7, '密码长度至少为 7 位'),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  /**
   * 处理表单提交
   * 调用注册 API，成功后跳转到 OTP 验证页面
   */
  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      await authService.register({
        email: data.email,
        password: data.password,
      })

      // 注册成功，显示提示信息
      toast.success('注册成功！验证码已发送到您的邮箱，请查收。')

      // 跳转到 OTP 验证页面，传递 email 参数
      navigate({
        to: '/otp',
        search: { email: data.email },
      })
    } catch (error) {
      // 错误处理
      handleServerError(error)

      // 如果是网络错误，在控制台输出详细信息以便调试
      if (
        error &&
        typeof error === 'object' &&
        'request' in error &&
        !('response' in error)
      ) {
        const apiBaseURL =
          import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        // eslint-disable-next-line no-console
        console.error('注册失败 - 网络错误详情:', {
          error,
          apiBaseURL,
          message: '请确保后端服务已启动并且 CORS 配置正确',
          tips: [
            `1. 检查后端服务是否运行在 ${apiBaseURL}`,
            '2. 检查后端服务的 CORS 配置是否允许前端地址',
            '3. 检查浏览器控制台的 Network 标签页查看具体错误',
          ],
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? '注册中...' : '创建账户'}
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              或使用以下方式继续
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button
            variant='outline'
            className='w-full'
            type='button'
            disabled={isLoading}
          >
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button
            variant='outline'
            className='w-full'
            type='button'
            disabled={isLoading}
          >
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}
