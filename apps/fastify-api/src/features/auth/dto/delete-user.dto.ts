import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 删除用户 DTO。
 *
 * @description 用于删除用户账户的数据传输对象。
 */
export class DeleteUserDto {
  /**
   * 用户 ID。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString()
  user_id: string;

  /**
   * 用户密码（用于验证）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString()
  password: string;
}
