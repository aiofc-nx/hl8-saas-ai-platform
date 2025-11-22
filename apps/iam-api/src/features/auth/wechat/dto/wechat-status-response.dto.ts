import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * 微信登录状态响应 DTO。
 *
 * @description 包含登录状态和结果数据的响应。
 */
export class WechatStatusResponseDto {
  /**
   * 登录状态。
   *
   * @type {'pending' | 'scanned' | 'success' | 'failed'}
   */
  @IsEnum(['pending', 'scanned', 'success', 'failed'])
  status!: 'pending' | 'scanned' | 'success' | 'failed';

  /**
   * 登录票据。
   *
   * @type {string}
   */
  @IsString()
  ticket!: string;

  /**
   * 成功时的数据（用户和令牌）。
   *
   * @type {object}
   */
  @IsObject()
  @IsOptional()
  data?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    tokens: {
      access_token: string;
      refresh_token: string;
    };
  };

  /**
   * 失败时的错误信息。
   *
   * @type {string}
   */
  @IsString()
  @IsOptional()
  error?: string;
}
