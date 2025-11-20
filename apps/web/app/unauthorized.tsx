'use client';
import { Button } from '@repo/shadcn/button';
import { cn } from '@repo/shadcn/lib/utils';
import { RotateCw } from '@repo/shadcn/lucide';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

/**
 * @description 401 未授权访问页面组件
 * @remarks 当用户尝试访问需要认证但未登录的资源时显示此页面
 */
const Unauthorized = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">401</h1>
        <span className="font-medium">未授权访问</span>
        <p className="text-muted-foreground text-center">
          {'您需要登录才能访问此页面。'} <br />
          请先登录，然后重试。
        </p>
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => {
              startTransition(() => {
                router.push('/auth/sign-in'); // 可以更改此路由为您的登录路由
              });
            }}
          >
            <RotateCw className={cn('size-4', isPending && 'animate-spin')} />
            前往登录
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
