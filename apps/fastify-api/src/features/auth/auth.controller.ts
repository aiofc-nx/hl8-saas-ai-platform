import { Public } from '@/common/decorators';
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard';
import {
  MessageResponse,
  RefreshTokenResponse,
  SessionResponse,
  SessionsResponse,
  SignInResponse,
} from '@/common/interfaces';
import {
  ChangePasswordDto,
  ConfirmEmailDto,
  CreateUserDto,
  DeleteUserDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignInUserDto,
  SignOutAllDeviceUserDto,
  SignOutUserDto,
} from '@/features/auth/dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * 认证控制器，用于处理认证和用户账户相关的端点。
 *
 * @description 提供以下端点：
 * - 用户注册
 * - 用户登录和登出
 * - 令牌刷新
 * - 会话管理
 * - 邮箱确认
 * - 密码重置和修改
 * - 账户删除
 */
@Controller('auth')
export class AuthController {
  /**
   * 创建 AuthController 实例。
   *
   * @param {AuthService} authService - 认证服务。
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * 注册新用户。
   *
   * @description 创建新用户账户，发送邮箱确认邮件。
   *
   * @param {CreateUserDto} createUserDto - 创建新用户的数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Public()
  @Post('sign-up')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<MessageResponse> {
    await this.authService.register(createUserDto);
    return { message: 'User registered successfully' };
  }

  /**
   * 用户登录。
   *
   * @description 验证用户凭据，生成访问令牌和刷新令牌，创建会话。
   *
   * @param {SignInUserDto} signInUserDto - 用户登录凭据。
   * @returns {Promise<SignInResponse>} 包含令牌和用户数据的登录响应。
   */
  @Public()
  @Post('sign-in')
  async signIn(@Body() signInUserDto: SignInUserDto): Promise<SignInResponse> {
    const data = await this.authService.signIn(signInUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, sessions: _sessions, ...result } = data.data;

    return {
      message: 'User signed in successfully',
      data: result,
      tokens: data.tokens,
    };
  }

  /**
   * 用户从当前会话登出。
   *
   * @description 删除当前设备的会话记录。
   *
   * @param {SignOutUserDto} signOutUserDto - 登出数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Post('sign-out')
  async signOut(
    @Body() signOutUserDto: SignOutUserDto,
  ): Promise<MessageResponse> {
    await this.authService.signOut(signOutUserDto);
    return { message: 'User signed out successfully' };
  }

  /**
   * 用户从所有设备登出。
   *
   * @description 删除用户在所有设备上的所有会话记录。
   *
   * @param {SignOutAllDeviceUserDto} dto - 从所有设备登出的数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Post('sign-out-allDevices')
  async signOutAllDevices(
    @Body() dto: SignOutAllDeviceUserDto,
  ): Promise<MessageResponse> {
    await this.authService.signOutAllDevices(dto);
    return { message: 'User signed out from all devices successfully' };
  }

  /**
   * 检索用户的所有会话。
   *
   * @description 获取指定用户在所有设备上的所有活动会话信息。
   *
   * @param {string} userId - 用户 ID。
   * @returns {Promise<SessionsResponse>} 用户会话列表。
   */
  @Get('sessions/:userId')
  async sessions(@Param('userId') userId: string): Promise<SessionsResponse> {
    const data = await this.authService.getSessions(userId);
    return { data };
  }

  /**
   * 根据会话 ID 检索会话。
   *
   * @description 根据会话 ID 获取单个会话的详细信息。
   *
   * @param {string} id - 会话 ID。
   * @returns {Promise<SessionResponse>} 会话详情。
   */
  @Get('session/:id')
  async session(@Param('id') id: string): Promise<SessionResponse> {
    const data = await this.authService.getSession(id);
    return { data };
  }

  /**
   * 确认用户邮箱。
   *
   * @description 使用 OTP 验证码确认用户邮箱地址。
   * 此端点标记为公共，因为用户可能还没有验证邮箱，无法提供有效的认证令牌。
   *
   * @param {ConfirmEmailDto} confirmEmailDto - 邮箱确认数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Public()
  @Patch('confirm-email')
  async confirmEmail(
    @Body() confirmEmailDto: ConfirmEmailDto,
  ): Promise<MessageResponse> {
    await this.authService.confirmEmail(confirmEmailDto);
    return { message: 'Email confirmed successfully' };
  }

  /**
   * 重新发送邮箱确认邮件。
   *
   * @description 为未验证邮箱的用户重新发送确认邮件。
   * 此端点标记为公共，因为用户可能还没有验证邮箱，无法提供有效的认证令牌。
   *
   * @param {string} email - 用户邮箱地址（从请求体获取）。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Public()
  @Post('resend-confirmation-email')
  async resendConfirmationEmail(
    @Body('email') email: string,
  ): Promise<MessageResponse> {
    await this.authService.resendConfirmationEmail(email);
    return { message: 'Confirmation email sent successfully' };
  }

  /**
   * 发送密码重置邮件。
   *
   * @description 为忘记密码的用户发送包含 OTP 验证码的重置密码邮件。
   *
   * @param {ForgotPasswordDto} forgotPasswordDto - 密码重置请求数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Public()
  @Patch('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponse> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'Password reset token sent to your email' };
  }

  /**
   * 使用令牌重置用户密码。
   *
   * @description 使用 OTP 验证码重置忘记密码的用户的密码。
   *
   * @param {ResetPasswordDto} dto - 重置密码数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Public()
  @Patch('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponse> {
    await this.authService.resetPassword(dto);
    return { message: 'Password changed successfully' };
  }

  /**
   * 修改用户密码。
   *
   * @description 已登录用户修改自己的密码，需要提供当前密码和新密码。
   *
   * @param {ChangePasswordDto} dto - 修改密码数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Patch('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponse> {
    await this.authService.changePassword(dto);
    return { message: 'Password changed successfully' };
  }

  /**
   * 使用刷新令牌刷新访问令牌。
   *
   * @description 使用有效的刷新令牌生成新的访问令牌和刷新令牌对。
   *
   * @param {RefreshTokenDto} dto - 刷新令牌数据。
   * @returns {Promise<RefreshTokenResponse>} 刷新令牌响应。
   */
  @UseGuards(JwtRefreshGuard)
  @Patch('refresh-token')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<RefreshTokenResponse> {
    const data = await this.authService.refreshToken(dto);
    return {
      message: 'Refresh token generated successfully',
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      access_token_refresh_time: data.access_token_refresh_time,
      session_token: data.session_token,
    };
  }

  /**
   * 删除用户账户。
   *
   * @description 永久删除用户账户及其所有相关数据。
   *
   * @param {DeleteUserDto} deleteUserDto - 删除用户数据。
   * @returns {Promise<MessageResponse>} 响应消息。
   */
  @Delete('delete-account')
  async deleteUser(
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<MessageResponse> {
    await this.authService.deleteAccount(deleteUserDto);
    return { message: 'User deleted successfully' };
  }
}
