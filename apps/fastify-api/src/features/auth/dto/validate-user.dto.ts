import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 验证用户 DTO。
 *
 * @description 用于验证用户凭据的数据传输对象。
 */
export class ValidateUserDto {
  /**
   * 用户标识符（邮箱或用户名）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'First name must be a string',
  })
  identifier: string;

  /**
   * 用户密码。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'Password must be a string',
  })
  password: string;
}
