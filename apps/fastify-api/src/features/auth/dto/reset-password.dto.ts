import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 重置密码 DTO。
 *
 * @description 用于重置用户密码的数据传输对象。
 */
export class ResetPasswordDto {
  /**
   * 用户标识符（邮箱或用户名）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'Identifier must be a string',
  })
  identifier: string;

  /**
   * 重置令牌（OTP 验证码）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'Reset Token must be a string',
  })
  resetToken: string;

  /**
   * 新密码。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'New password must be a string',
  })
  newPassword: string;
}
