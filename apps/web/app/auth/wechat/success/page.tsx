'use client';

import LogoIcon from '@/components/logo-icon';
import {
  getWechatLoginStatus,
  handleWechatLoginSuccess,
} from '@/server/auth.server';
import { WechatStatus } from '@/types/auth.type';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { cn } from '@repo/shadcn/lib/utils';
import { useAction } from 'next-safe-action/hooks';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * 微信登录成功页面。
 *
 * @description 处理微信登录成功后的会话创建和重定向。
 * 从 URL 参数获取 ticket，查询登录状态，并创建用户会话。
 */
const WechatLoginSuccessPage = () => {
  const searchParams = useSearchParams();
  const ticket = searchParams.get('ticket');
  // 如果 ticket 不存在，直接设置错误（避免在 useEffect 中同步调用 setState）
  const [error, setError] = useState<string | null>(() => {
    // 在初始化时检查 ticket，避免在 useEffect 中同步调用 setState
    return null; // 初始值为 null，在 useEffect 中异步设置
  });

  // 处理登录成功的动作
  const {
    execute: handleLoginSuccess,
    isExecuting: isHandling,
    result: handleResult,
  } = useAction(handleWechatLoginSuccess, {
    onError: (error) => {
      setError(
        (error as { serverError?: string }).serverError ||
          '创建会话失败，请重试',
      );
    },
  });

  // 获取登录状态的动作
  const { execute: checkStatus, result: statusResult } = useAction(
    getWechatLoginStatus,
    {
      onSuccess: (data) => {
        // data 就是 WechatStatus 类型的数据
        const statusData = data as unknown as WechatStatus;
        if (statusData?.status === 'success' && statusData.data) {
          // 使用获取到的用户和令牌信息创建会话
          handleLoginSuccess({
            user: statusData.data.user,
            tokens: {
              access_token: statusData.data.tokens.access_token,
              refresh_token: statusData.data.tokens.refresh_token,
              session_token:
                statusData.data.tokens.session_token || ticket || '',
              session_refresh_time:
                statusData.data.tokens.session_refresh_time.toISOString(),
            },
          });
        } else if (statusData?.status === 'failed') {
          setError(statusData.error || '登录状态异常，请重试');
        } else if (!statusData || statusData.status !== 'success') {
          setError('登录状态异常，请重试');
        }
      },
      onError: (error) => {
        setError(
          (error as { serverError?: string }).serverError ||
            '获取登录状态失败，请重试',
        );
      },
    },
  );

  // 页面加载时查询登录状态
  useEffect(() => {
    if (!ticket) {
      setError('缺少登录票据，请重试');
      return;
    }
    checkStatus({ ticket });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]); // 只依赖 ticket，避免 checkStatus 变化时重复调用

  // 使用类型断言访问 serverError（因为 next-safe-action 的类型定义可能不够精确）
  const statusError = (
    statusResult as { error?: { serverError?: string } } | undefined
  )?.error?.serverError;
  const handleError = (
    handleResult as { error?: { serverError?: string } } | undefined
  )?.error?.serverError;
  const displayError = error || statusError || handleError;

  return (
    <div className="min-h-dvh flex justify-center items-center container">
      <Card className="max-w-xl w-full mx-auto">
        <CardHeader className="text-center mb-7">
          <LogoIcon className="mb-3" />
          <CardTitle className="text-xl text-start">微信登录</CardTitle>
          <CardDescription
            className={cn('text-start', displayError && 'text-red-500')}
          >
            {displayError ??
              (isHandling ? '正在完成登录...' : '正在验证登录状态...')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {!displayError && !isHandling && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}
            {displayError && (
              <div className="text-center space-y-4">
                <p className="text-red-500">{displayError}</p>
                <button
                  onClick={() => {
                    window.location.href = '/auth/wechat';
                  }}
                  className="text-sm text-primary hover:underline"
                  type="button"
                >
                  返回微信登录
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WechatLoginSuccessPage;
