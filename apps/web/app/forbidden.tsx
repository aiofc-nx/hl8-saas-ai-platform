'use client';
import { Button } from '@repo/shadcn/button';
import { cn } from '@repo/shadcn/lib/utils';
import { RotateCw } from '@repo/shadcn/lucide';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

/**
 * @description 403 禁止访问页面组件
 * @remarks 当用户尝试访问没有权限的资源时显示此页面
 */
const Forbidden = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">403</h1>
        <span className="font-medium">访问被拒绝</span>
        <p className="text-muted-foreground text-center">
          {'您没有权限访问此页面。'} <br />
          如果您认为这是一个错误，请联系管理员。
        </p>
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => {
              startTransition(() => {
                router.push('/');
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

export default Forbidden;
