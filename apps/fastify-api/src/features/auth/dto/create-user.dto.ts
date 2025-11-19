import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * 创建用户 DTO。
 *
 * @description 用于用户注册的数据传输对象。
 */
export class CreateUserDto {
  /**
   * 用户邮箱地址。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsEmail()
  email: string;

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
