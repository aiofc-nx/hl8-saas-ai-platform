import { EnvConfig } from '@/common/utils/validateEnv';
import { User } from '@/features/users/entities/user.entity';
import { JwtAuthGuard } from '@hl8/auth/guards';
import { GeneralBadRequestException } from '@hl8/exceptions';
import { getRepositoryToken } from '@hl8/mikro-orm-nestjs';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthService } from '../auth.service';
import { WechatLoginTicket } from './entities/wechat-login-ticket.entity';
import { WechatAuthController } from './wechat-auth.controller';
import { WechatAuthService } from './wechat-auth.service';

// Mock @repo/constants/app 模块
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
}));

/**
 * WechatAuthController 的单元测试套件。
 *
 * @description 测试微信认证控制器的各个端点，包括：
 * - 生成登录二维码
 * - 处理微信授权回调
 * - 查询登录状态
 * - 生成绑定二维码
 */
describe('WechatAuthController', () => {
  let controller: WechatAuthController;
  let wechatAuthService: jest.Mocked<WechatAuthService>;
  let config: EnvConfig;

  beforeEach(async () => {
    // 创建模拟的 WechatAuthService
    wechatAuthService = {
      generateQrcode: jest.fn(),
      handleCallback: jest.fn(),
      getLoginStatus: jest.fn(),
    } as unknown as jest.Mocked<WechatAuthService>;

    config = {
      FRONTEND_URL: 'http://localhost:3000',
    } as EnvConfig;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WechatAuthController],
      providers: [
        {
          provide: WechatAuthService,
          useValue: wechatAuthService,
        },
        {
          provide: EnvConfig,
          useValue: config,
        },
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(WechatLoginTicket),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<WechatAuthController>(WechatAuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(controller).toBeDefined();
  });

  describe('generateQrcode', () => {
    it('应该成功生成登录二维码', async () => {
      // 准备测试数据
      const mockResponse = {
        ticket: 'ticket-uuid-123',
        qrcodeUrl: 'https://open.weixin.qq.com/...',
        expiresIn: 300,
      };

      wechatAuthService.generateQrcode = jest
        .fn()
        .mockResolvedValue(mockResponse);

      // 执行测试
      const result = await controller.generateQrcode();

      // 验证结果
      expect(result).toEqual(mockResponse);
      expect(wechatAuthService.generateQrcode).toHaveBeenCalledWith();
      expect(wechatAuthService.generateQrcode).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback', () => {
    it('应该成功处理微信回调并重定向', async () => {
      // 准备测试数据
      const code = 'wechat-code-123';
      const state = 'ticket-uuid-123';
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      wechatAuthService.handleCallback = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      await controller.callback(code, state, res);

      // 验证结果
      expect(wechatAuthService.handleCallback).toHaveBeenCalledWith(
        code,
        state,
      );
      expect(wechatAuthService.handleCallback).toHaveBeenCalledTimes(1);
      expect(res.redirect).toHaveBeenCalledWith(
        `${config.FRONTEND_URL}/auth/wechat/success?ticket=${state}`,
      );
    });

    it('应该在处理失败时重定向到错误页面', async () => {
      // 准备测试数据
      const code = 'invalid-code';
      const state = 'ticket-uuid-123';
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      wechatAuthService.handleCallback = jest
        .fn()
        .mockRejectedValue(new Error('授权失败'));

      // 执行测试
      await controller.callback(code, state, res);

      // 验证结果
      expect(wechatAuthService.handleCallback).toHaveBeenCalledWith(
        code,
        state,
      );
      expect(res.redirect).toHaveBeenCalledWith(
        `${config.FRONTEND_URL}/auth/wechat/error?ticket=${state}`,
      );
    });
  });

  describe('getStatus', () => {
    it('应该成功获取待处理状态', async () => {
      // 准备测试数据
      const ticket = 'ticket-uuid-123';
      const mockResponse = {
        status: 'pending' as const,
        ticket,
      };

      wechatAuthService.getLoginStatus = jest
        .fn()
        .mockResolvedValue(mockResponse);

      // 执行测试
      const result = await controller.getStatus(ticket);

      // 验证结果
      expect(result).toEqual(mockResponse);
      expect(wechatAuthService.getLoginStatus).toHaveBeenCalledWith(ticket);
      expect(wechatAuthService.getLoginStatus).toHaveBeenCalledTimes(1);
    });

    it('应该成功获取成功状态', async () => {
      // 准备测试数据
      const ticket = 'ticket-uuid-123';
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      } as User;

      const mockResponse = {
        status: 'success' as const,
        ticket,
        data: {
          user,
          tokens: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
      };

      wechatAuthService.getLoginStatus = jest
        .fn()
        .mockResolvedValue(mockResponse);

      // 执行测试
      const result = await controller.getStatus(ticket);

      // 验证结果
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data?.user).toEqual(user);
      expect(result.data?.tokens).toBeDefined();
    });

    it('应该成功获取失败状态', async () => {
      // 准备测试数据
      const ticket = 'ticket-uuid-123';
      const mockResponse = {
        status: 'failed' as const,
        ticket,
        error: '授权失败',
      };

      wechatAuthService.getLoginStatus = jest
        .fn()
        .mockResolvedValue(mockResponse);

      // 执行测试
      const result = await controller.getStatus(ticket);

      // 验证结果
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('failed');
      expect(result.error).toBe('授权失败');
    });
  });

  describe('generateBindQrcode', () => {
    it('应该成功生成绑定二维码', async () => {
      // 准备测试数据
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        wechatOpenid: undefined, // 未绑定微信
      } as User;

      const mockResponse = {
        ticket: 'ticket-uuid-123',
        qrcodeUrl: 'https://open.weixin.qq.com/...',
        expiresIn: 300,
      };

      wechatAuthService.generateQrcode = jest
        .fn()
        .mockResolvedValue(mockResponse);

      // 执行测试
      const result = await controller.generateBindQrcode(user);

      // 验证结果
      expect(result).toEqual(mockResponse);
      expect(wechatAuthService.generateQrcode).toHaveBeenCalledWith(user.id);
      expect(wechatAuthService.generateQrcode).toHaveBeenCalledTimes(1);
    });

    it('应该在用户已绑定微信时抛出异常', async () => {
      // 准备测试数据
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        wechatOpenid: 'openid-123', // 已绑定微信
      } as User;

      // 执行测试并验证异常
      await expect(controller.generateBindQrcode(user)).rejects.toThrow(
        GeneralBadRequestException,
      );
      await expect(controller.generateBindQrcode(user)).rejects.toThrow(
        '用户已绑定微信账号，无需重复绑定',
      );

      // 验证服务未被调用
      expect(wechatAuthService.generateQrcode).not.toHaveBeenCalled();
    });
  });
});
