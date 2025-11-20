'use client';

import { Button } from '@repo/shadcn/button';
import { cn } from '@repo/shadcn/lib/utils';
import { RotateCw } from '@repo/shadcn/lucide';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';

/**
 * @description Next.js 错误边界组件，用于捕获和显示应用中的错误
 * @param error - 错误对象，包含错误信息
 * @param reset - 重置错误的回调函数，用于尝试重新渲染
 */
const Error = ({ error, reset }: { error: Error; reset: () => void }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    // 将错误记录到错误报告服务
    console.error(error);
  }, [error]);

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        {/*<h1 className="text-[7rem] leading-tight font-bold">Error {error.message}</h1>*/}
        <span className="font-medium">出错了</span>
        <p className="text-muted-foreground text-center">
          {'发生了意外错误。'}
          <br />
          请尝试刷新页面或返回首页。
        </p>
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => {
              startTransition(() => {
                reset();
                router.refresh();
              });
            }}
          >
            <RotateCw className={cn('size-4', isPending && 'animate-spin')} />
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Error;
