import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 刷新令牌 DTO。
 *
 * @description 用于刷新访问令牌的数据传输对象。
 */
export class RefreshTokenDto {
  /**
   * 用户 ID。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'User Id must be a string',
  })
  user_id: string;

  /**
   * 会话令牌。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'Session token must be a string',
  })
  session_token: string;
}

