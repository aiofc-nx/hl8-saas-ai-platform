import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 忘记密码 DTO。
 *
 * @description 用于请求密码重置的数据传输对象。
 */
export class ForgotPasswordDto {
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
}

