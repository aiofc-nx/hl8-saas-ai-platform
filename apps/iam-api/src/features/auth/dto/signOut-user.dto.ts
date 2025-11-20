import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * 用户登出 DTO。
 *
 * @description 用于用户登出的数据传输对象。
 */
export class SignOutUserDto {
  /**
   * 会话令牌（UUID）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsUUID()
  session_token: string;
}
