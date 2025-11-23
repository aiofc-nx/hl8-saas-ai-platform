import { IsNumber, IsString } from 'class-validator';

/**
 * 微信二维码响应 DTO。
 *
 * @description 包含登录票据和二维码 URL 的响应。
 */
export class WechatQrcodeResponseDto {
  /**
   * 登录票据。
   *
   * @type {string}
   */
  @IsString()
  ticket!: string;

  /**
   * 二维码 URL（或授权 URL）。
   *
   * @type {string}
   */
  @IsString()
  qrcodeUrl!: string;

  /**
   * 过期时间（秒）。
   *
   * @type {number}
   */
  @IsNumber()
  expiresIn!: number;
}
