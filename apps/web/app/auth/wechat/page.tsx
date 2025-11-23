import WechatLoginForm from '@/components/auth/form/wechat-login.form';

/**
 * 微信登录页面。
 *
 * @description 显示微信登录二维码，供用户扫码登录。
 */
const WechatLoginPage = () => {
  return (
    <div className="min-h-dvh flex justify-center items-center container">
      <WechatLoginForm />
    </div>
  );
};

export default WechatLoginPage;
