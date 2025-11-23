import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

const formSchema = z.object({
  otp: z
    .string()
    .min(6, '请输入 6 位验证码')
    .max(6, '请输入 6 位验证码')
    .regex(/^\d+$/, '验证码只能包含数字'),
})

type OtpFormProps = React.HTMLAttributes<HTMLFormElement>

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/otp' })
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { auth } = useAuthStore()

  const email = search.email as string

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  // 监听 OTP 输入
  const otp = form.watch('otp')

  /**
   * 处理表单提交
   * 调用邮箱确认 API，成功后保存令牌和用户数据，跳转到首页
   */
  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!email) {
      toast.error('缺少邮箱地址，请重新注册')
      navigate({ to: '/sign-up' })
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.confirmEmail({
        email,
        token: data.otp,
      })

      // 保存令牌和用户数据
      auth.setTokens(response.tokens)
      auth.setUser(response.data)

      // 显示成功消息
      toast.success('邮箱验证成功！欢迎加入！')

      // 跳转到管理后台
      navigate({ to: '/apps', replace: true })
    } catch (error) {
      // 错误处理
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 重发验证码
   */
  async function handleResendCode() {
    if (!email) {
      toast.error('缺少邮箱地址')
      return
    }

    setIsResending(true)

    try {
      await authService.resendConfirmationEmail(email)
      toast.success('验证码已重新发送，请查收邮箱')
    } catch (error) {
      handleServerError(error)
    } finally {
      setIsResending(false)
    }
  }

  // 如果没有邮箱地址，显示错误提示
  if (!email) {
    return (
      <div className='space-y-4 text-center'>
        <p className='text-destructive'>缺少邮箱地址，请重新注册</p>
        <Button onClick={() => navigate({ to: '/sign-up' })}>返回注册</Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
        {...props}
      >
        <div className='text-muted-foreground mb-2 text-center text-sm'>
          <p>验证码已发送到</p>
          <p className='text-foreground font-medium'>{email}</p>
        </div>

        <FormField
          control={form.control}
          name='otp'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='sr-only'>一次性验证码</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  {...field}
                  containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-12'
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className='mt-2' disabled={otp.length < 6 || isLoading}>
          {isLoading ? '验证中...' : '验证'}
        </Button>

        <div className='text-center text-sm'>
          <button
            type='button'
            onClick={handleResendCode}
            disabled={isResending}
            className='text-muted-foreground hover:text-foreground underline disabled:opacity-50'
          >
            {isResending ? '发送中...' : '重新发送验证码'}
          </button>
        </div>
      </form>
    </Form>
  )
}
