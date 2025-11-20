import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * 用户登录 DTO。
 *
 * @description 用于用户登录的数据传输对象，包含登录凭据和设备信息。
 */
export class SignInUserDto {
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
   * 用户密码。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsString({
    message: 'Password must be a string',
  })
  password: string;

  /**
   * IP 地址（可选）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  ip?: string;

  /**
   * 地理位置（可选）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * 设备名称（可选）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  device_name?: string;

  /**
   * 设备操作系统（可选）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  device_os?: string;

  /**
   * 设备类型（可选）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  device_type?: string;

  /**
   * 浏览器（可选）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  browser?: string;

  /**
   * 用户代理字符串（可选）。
   *
   * @type {string}
   */
  @ApiProperty()
  @IsOptional()
  @IsString()
  userAgent?: string;
}
