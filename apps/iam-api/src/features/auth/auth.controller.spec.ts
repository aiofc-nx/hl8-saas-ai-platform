import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard';
import { User } from '@/features/users/entities/user.entity';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
} from './dto';
import { Session } from './entities/session.entity';

// Mock @repo/constants/app 模块
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
}));

/**
 * AuthController 的单元测试套件。
 *
 * @description 测试认证控制器的各个端点，包括：
 * - 用户注册和登录
 * - 用户登出
 * - 会话管理
 * - 邮箱确认
 * - 密码重置和修改
 * - 令牌刷新
 * - 账户删除
 */
describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    // 创建模拟的 AuthService
    authService = {
      register: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signOutAllDevices: jest.fn(),
      getSessions: jest.fn(),
      getSession: jest.fn(),
      confirmEmail: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      deleteAccount: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtRefreshGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // 准备测试数据
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.register = jest.fn().mockResolvedValue({
        data: { id: '1', email: createUserDto.email } as User,
      });

      // 执行测试
      const result = await controller.register(createUserDto);

      // 验证结果
      expect(result).toEqual({ message: 'User registered successfully' });
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('signIn', () => {
    it('应该成功登录用户', async () => {
      // 准备测试数据
      const signInDto: SignInUserDto = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        profile: { name: 'Test User' },
      } as User;

      const tokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        session_token: 'session-1',
        session_refresh_time: new Date().toISOString(),
      };

      authService.signIn = jest.fn().mockResolvedValue({
        data: user,
        tokens,
      });

      // 执行测试
      const result = await controller.signIn(signInDto);

      // 验证结果
      expect(result.message).toBe('User signed in successfully');
      expect(result.data).not.toHaveProperty('password');
      expect(result.tokens).toEqual(tokens);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });
  });

  describe('signOut', () => {
    it('应该成功登出用户', async () => {
      // 准备测试数据
      const signOutDto: SignOutUserDto = {
        session_token: 'session-1',
      };

      authService.signOut = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await controller.signOut(signOutDto);

      // 验证结果
      expect(result).toEqual({ message: 'User signed out successfully' });
      expect(authService.signOut).toHaveBeenCalledWith(signOutDto);
    });
  });

  describe('signOutAllDevices', () => {
    it('应该成功从所有设备登出', async () => {
      // 准备测试数据
      const dto: SignOutAllDeviceUserDto = {
        userId: '1',
      };

      authService.signOutAllDevices = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await controller.signOutAllDevices(dto);

      // 验证结果
      expect(result).toEqual({
        message: 'User signed out from all devices successfully',
      });
      expect(authService.signOutAllDevices).toHaveBeenCalledWith(dto);
    });
  });

  describe('sessions', () => {
    it('应该成功获取用户的所有会话', async () => {
      // 准备测试数据
      const userId = '1';
      const sessions = [
        { id: 'session-1', user: { id: userId } } as Session,
        { id: 'session-2', user: { id: userId } } as Session,
      ];

      authService.getSessions = jest.fn().mockResolvedValue(sessions);

      // 执行测试
      const result = await controller.sessions(userId);

      // 验证结果
      expect(result.data).toEqual(sessions);
      expect(authService.getSessions).toHaveBeenCalledWith(userId);
    });
  });

  describe('session', () => {
    it('应该成功获取单个会话', async () => {
      // 准备测试数据
      const sessionId = 'session-1';
      const session = {
        id: sessionId,
        user: { id: '1' } as User,
      } as Session;

      authService.getSession = jest.fn().mockResolvedValue(session);

      // 执行测试
      const result = await controller.session(sessionId);

      // 验证结果
      expect(result.data).toEqual(session);
      expect(authService.getSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('confirmEmail', () => {
    it('应该成功确认用户邮箱', async () => {
      // 准备测试数据
      const dto: ConfirmEmailDto = {
        email: 'test@example.com',
        token: '123456',
      };

      authService.confirmEmail = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await controller.confirmEmail(dto);

      // 验证结果
      expect(result).toEqual({ message: 'Email confirmed successfully' });
      expect(authService.confirmEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    it('应该成功发送密码重置邮件', async () => {
      // 准备测试数据
      const dto: ForgotPasswordDto = {
        identifier: 'test@example.com',
      };

      authService.forgotPassword = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await controller.forgotPassword(dto);

      // 验证结果
      expect(result).toEqual({
        message: 'Password reset token sent to your email',
      });
      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword', () => {
    it('应该成功重置用户密码', async () => {
      // 准备测试数据
      const dto: ResetPasswordDto = {
        identifier: 'test@example.com',
        resetToken: '123456',
        newPassword: 'newpassword123',
      };

      authService.resetPassword = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await controller.resetPassword(dto);

      // 验证结果
      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('changePassword', () => {
    it('应该成功修改用户密码', async () => {
      // 准备测试数据
      const dto: ChangePasswordDto = {
        identifier: 'test@example.com',
        password: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      authService.changePassword = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await controller.changePassword(dto);

      // 验证结果
      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(authService.changePassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新访问令牌', async () => {
      // 准备测试数据
      const dto: RefreshTokenDto = {
        user_id: '1',
        session_token: 'session-1',
      };

      const refreshData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        session_token: 'session-1',
        access_token_refresh_time: new Date().toISOString(),
      };

      authService.refreshToken = jest.fn().mockResolvedValue(refreshData);

      // 执行测试
      const result = await controller.refreshToken(dto);

      // 验证结果
      expect(result.message).toBe('Refresh token generated successfully');
      expect(result.access_token).toBe(refreshData.access_token);
      expect(result.refresh_token).toBe(refreshData.refresh_token);
      expect(authService.refreshToken).toHaveBeenCalledWith(dto);
    });
  });

  describe('deleteUser', () => {
    it('应该成功删除用户账户', async () => {
      // 准备测试数据
      const dto: DeleteUserDto = {
        user_id: '1',
        password: 'password123',
      };

      authService.deleteAccount = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await controller.deleteUser(dto);

      // 验证结果
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(authService.deleteAccount).toHaveBeenCalledWith(dto);
    });
  });
});
