import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 确认邮箱 DTO。
 *
 * @description 用于确认用户邮箱的数据传输对象。
 */
export class ConfirmEmailDto {
  /**
   * OTP 验证码。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString()
  @MaxLength(6)
  @MinLength(6)
  token: string;

  /**
   * 用户邮箱地址。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsEmail()
  email: string;
}

