'use client';

import LogoIcon from '@/components/logo-icon';
import {
  generateWechatQrcode,
  getWechatLoginStatus,
} from '@/server/auth.server';
import { WechatQrcode, WechatStatus } from '@/types/auth.type';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { cn } from '@repo/shadcn/lib/utils';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
// 使用 img 标签显示二维码，通过二维码生成 API

/**
 * 微信登录表单组件。
 *
 * @description 显示微信登录二维码，并轮询检查登录状态。
 * 当用户扫描二维码并确认登录后，会自动完成登录流程。
 */
const WechatLoginForm = () => {
  const [ticket, setTicket] = useState<string | null>(null);
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // 生成二维码的动作
  const {
    execute: generateQrcode,
    isExecuting: isGenerating,
    result,
  } = useAction(generateWechatQrcode, {
    onSuccess: (data) => {
      // data 就是 WechatQrcode 类型
      const qrcodeData = data as unknown as WechatQrcode;
      if (qrcodeData) {
        setTicket(qrcodeData.ticket);
        setQrcodeUrl(qrcodeData.qrcodeUrl);
        setExpiresIn(qrcodeData.expiresIn);
        setError(null);
        setIsPolling(true);
      }
    },
    onError: (error) => {
      setError(
        (error as { serverError?: string }).serverError ||
          '生成二维码失败，请稍后重试',
      );
      setIsPolling(false);
    },
  });

  // 查询登录状态的动作
  const { execute: checkStatus, result: statusResult } = useAction(
    getWechatLoginStatus,
    {
      onSuccess: (data) => {
        // data 就是 WechatStatus 类型
        const statusData = data as unknown as WechatStatus;
        if (statusData?.status === 'success' && statusData.data) {
          // 登录成功，重定向到成功页面（由成功页面处理会话创建）
          window.location.href = `/auth/wechat/success?ticket=${statusData.ticket}`;
        } else if (statusData?.status === 'failed') {
          setError(statusData.error || '登录失败，请稍后重试');
          setIsPolling(false);
        }
        // pending 或 scanned 状态继续轮询
      },
      onError: (error) => {
        // 如果是票据过期等错误，停止轮询
        setIsPolling(false);
        setError(
          (error as { serverError?: string }).serverError || '查询登录状态失败',
        );
      },
    },
  );

  // 组件挂载时生成二维码
  useEffect(() => {
    generateQrcode();
  }, [generateQrcode]);

  // 轮询检查登录状态
  useEffect(() => {
    if (!isPolling || !ticket) return;

    const interval = setInterval(() => {
      if (ticket) {
        checkStatus({ ticket });
      }
    }, 2000); // 每 2 秒轮询一次

    // 如果二维码过期，停止轮询
    const timeout = setTimeout(() => {
      setIsPolling(false);
      setError('二维码已过期，请刷新页面重新生成');
    }, expiresIn * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isPolling, ticket, expiresIn, checkStatus]);

  // 使用类型断言访问 serverError（因为 next-safe-action 的类型定义可能不够精确）
  const generateError = (
    result as { error?: { serverError?: string } } | undefined
  )?.error?.serverError;
  const statusError = (
    statusResult as { error?: { serverError?: string } } | undefined
  )?.error?.serverError;
  const displayError = error || generateError || statusError;

  return (
    <div className={cn('w-full flex flex-col gap-6')}>
      <Card className="max-w-xl w-full mx-auto">
        <CardHeader className="text-center mb-7">
          <LogoIcon className="mb-3" />
          <CardTitle className="text-xl text-start">微信扫码登录</CardTitle>
          <CardDescription
            className={cn('text-start', displayError && 'text-red-500')}
          >
            {displayError ??
              (isGenerating ? '正在生成二维码...' : '使用微信扫描二维码登录')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {qrcodeUrl ? (
              <>
                <div className="p-4 bg-white rounded-lg">
                  {/* 使用在线二维码生成服务显示二维码 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrcodeUrl)}`}
                    alt="微信登录二维码"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    请使用微信扫描上方二维码
                  </p>
                  {isPolling && (
                    <p className="text-xs text-muted-foreground">
                      等待扫描中...（二维码有效期 {expiresIn} 秒）
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  {isGenerating ? '正在生成二维码...' : '加载中...'}
                </p>
              </div>
            )}
            {displayError && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setError(null);
                    generateQrcode();
                  }}
                  className="text-sm text-primary hover:underline"
                  type="button"
                >
                  重新生成二维码
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WechatLoginForm;
