import { APP_NAME, APP_URL } from '@repo/constants/app';

/**
 * 登录成功邮件模板。
 *
 * @description 生成登录成功通知邮件 HTML 内容。
 * 用于通知用户账户登录信息，包括登录时间、位置、IP 地址和设备信息，提高账户安全性。
 *
 * @param {Object} params - 模板参数对象。
 * @param {string} params.username - 用户名。
 * @param {string} params.device - 登录设备信息。
 * @param {string} params.ipAddress - 登录 IP 地址。
 * @param {Date} params.loginTime - 登录时间。
 * @param {string} params.location - 登录位置信息。
 * @returns {string} 邮件 HTML 内容。
 *
 * @example
 * ```typescript
 * const html = SignInSuccessMail({
 *   username: 'zhangsan',
 *   device: 'Chrome on Windows',
 *   ipAddress: '192.168.1.1',
 *   loginTime: new Date(),
 *   location: 'Beijing, China',
 * });
 * await mailService.sendEmail({
 *   to: ['user@example.com'],
 *   subject: '登录通知',
 *   html,
 * });
 * ```
 */
export const SignInSuccessMail = ({
  username,
  device,
  ipAddress,
  loginTime,
  location,
}: {
  username: string;
  ipAddress: string;
  location: string;
  device: string;
  loginTime: Date;
}) => {
  return `
   <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="background-color:#efeef1">
    <div style="display:none; overflow:hidden; line-height:1px; opacity:0;">SignIn with your email</div>

    <table align="center" width="100%" style="max-width:580px; margin:30px auto 15px; background:#fff;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:30px; text-align:center;">
          <img src="${APP_URL}/assets/logo/icon.svg" alt="${APP_NAME}" width="50" height="50" style="display:block; margin:0 auto;" />
        </td>
      </tr>

      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #eee;">
            <tr>
              <td style="width:249px; border-bottom:1px solid #eee;"></td>
              <td style="width:102px; border-bottom:1px solid #9147ff;"></td>
              <td style="width:249px; border-bottom:1px solid #eee;"></td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:10px 20px;">
          <h4 style="margin-top:0;">Hi, ${username}</h4>

          <p style="font-size:14px; color:#333; line-height:1.5;">
            This is a confirmation that you successfully signed in to your <strong>${APP_NAME}</strong> account.
          </p>

          <p style="font-size:14px; color:#333; line-height:1.5;">
            <strong>Login Time: ${new Date(loginTime).toDateString()}</strong><br/>
            <strong>Location:${location}</strong><br/>
            <strong>IP Address:${ipAddress}</strong> <br/>
            <strong>Device:${device}</strong>
          </p>

          <p style="font-size:14px; color:#333; line-height:1.5;">
            If this wasn't you, please <a href="${APP_URL}/auth/login" style="color:#3b82f6;">reset your password</a> immediately and contact support.
          </p>

          <p style="font-size:14px; line-height:1.5;">
            Thanks,<br/>${APP_NAME} Support Team
          </p>
        </td>
      </tr>
    </table>

    <p style="text-align:center; color:#706a7b; font-size:14px; line-height:24px; margin:16px 0;">
      © ${new Date().getFullYear()} ${APP_NAME}, All Rights Reserved.
    </p>
  </body>
</html>
`;
};
