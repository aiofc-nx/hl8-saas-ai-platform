import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * 所有设备登出 DTO。
 *
 * @description 用于从所有设备登出的数据传输对象。
 */
export class SignOutAllDeviceUserDto {
  /**
   * 用户 ID（UUID）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsUUID()
  userId: string;
}

