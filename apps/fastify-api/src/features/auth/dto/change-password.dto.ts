import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 修改密码 DTO。
 *
 * @description 用于修改用户密码的数据传输对象。
 */
export class ChangePasswordDto {
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
   * 当前密码。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'Password must be a string',
  })
  password: string;

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

