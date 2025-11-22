import LogoIcon from '@/components/logo-icon';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import Link from 'next/link';

/**
 * 微信登录错误页面。
 *
 * @description 显示微信登录失败的错误信息，并提供返回选项。
 */
const WechatLoginErrorPage = () => {
  return (
    <div className="min-h-dvh flex justify-center items-center container">
      <Card className="max-w-xl w-full mx-auto">
        <CardHeader className="text-center mb-7">
          <LogoIcon className="mb-3" />
          <CardTitle className="text-xl text-start">微信登录失败</CardTitle>
          <CardDescription className="text-start">
            微信登录过程中出现错误，请重试
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">可能的原因：</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>用户拒绝了授权</li>
                <li>登录二维码已过期</li>
                <li>网络连接异常</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Link href="/auth/wechat" className="w-full">
                <Button className="w-full" type="button">
                  重新尝试微信登录
                </Button>
              </Link>
              <Link href="/auth/sign-in" className="w-full">
                <Button variant="outline" className="w-full" type="button">
                  使用账号密码登录
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WechatLoginErrorPage;
