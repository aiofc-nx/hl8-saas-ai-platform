import { EnvConfig } from '@/common/utils/validateEnv';
import { Profile } from '@/features/users/entities/profile.entity';
import { User } from '@/features/users/entities/user.entity';
import {
  GeneralBadRequestException,
  GeneralUnauthorizedException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { getRepositoryToken } from '@hl8/mikro-orm-nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { WechatLoginTicket } from './entities/wechat-login-ticket.entity';
import { WechatUserInfo } from './interfaces/wechat-user.interface';
import { WechatAuthService } from './wechat-auth.service';

// Mock @repo/constants/app 模块
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
}));

// Mock rxjs firstValueFrom
const mockFirstValueFrom = jest.fn();
jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  firstValueFrom: (...args: unknown[]) => mockFirstValueFrom(...args),
}));

/**
 * WechatAuthService 的单元测试套件。
 *
 * @description 测试微信认证服务的核心功能，包括：
 * - 生成登录二维码
 * - 处理微信回调
 * - 获取登录状态
 * - 创建微信用户
 * - 绑定微信账号
 */
describe('WechatAuthService', () => {
  let service: WechatAuthService;
  let httpService: jest.Mocked<HttpService>;
  let config: EnvConfig;
  let authService: jest.Mocked<AuthService>;
  let ticketRepository: jest.Mocked<EntityRepository<WechatLoginTicket>>;
  let userRepository: jest.Mocked<EntityRepository<User>>;
  let logger: jest.Mocked<Logger>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    // 创建模拟的 EntityManager
    entityManager = {
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // 创建模拟的仓库
    ticketRepository = {
      findOne: jest.fn(),
      getEntityManager: jest.fn().mockReturnValue(entityManager),
    } as unknown as jest.Mocked<EntityRepository<WechatLoginTicket>>;

    userRepository = {
      findOne: jest.fn(),
      getEntityManager: jest.fn().mockReturnValue(entityManager),
    } as unknown as jest.Mocked<EntityRepository<User>>;

    // 创建模拟的服务
    httpService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    config = {
      WECHAT_APP_ID: 'test-app-id',
      WECHAT_APP_SECRET: 'test-app-secret',
      WECHAT_REDIRECT_URI: 'http://localhost:3000/auth/wechat/callback',
      FRONTEND_URL: 'http://localhost:3000',
    } as EnvConfig;

    authService = {
      createWechatUser: jest.fn(),
      generateTokens: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WechatAuthService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: EnvConfig,
          useValue: config,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: getRepositoryToken(WechatLoginTicket),
          useValue: ticketRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<WechatAuthService>(WechatAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockFirstValueFrom.mockClear();
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('generateQrcode', () => {
    it('应该成功生成登录二维码', async () => {
      // 执行测试
      const result = await service.generateQrcode();

      // 验证结果
      expect(result).toHaveProperty('ticket');
      expect(result).toHaveProperty('qrcodeUrl');
      expect(result).toHaveProperty('expiresIn');
      expect(result.expiresIn).toBe(300); // 5 分钟
      expect(result.qrcodeUrl).toContain('open.weixin.qq.com');
      expect(result.qrcodeUrl).toContain(config.WECHAT_APP_ID);
      expect(result.qrcodeUrl).toContain(
        encodeURIComponent(config.WECHAT_REDIRECT_URI),
      );
      expect(entityManager.persist).toHaveBeenCalled();
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('应该在绑定模式下生成绑定二维码', async () => {
      const userId = 'user-123';

      // 执行测试
      const result = await service.generateQrcode(userId);

      // 验证结果
      expect(result).toHaveProperty('ticket');
      expect(result).toHaveProperty('qrcodeUrl');
      expect(result).toHaveProperty('expiresIn');

      // 验证保存的 ticket 包含 userId
      const persistCall = (entityManager.persist as jest.Mock).mock.calls[0][0];
      expect(persistCall).toBeInstanceOf(WechatLoginTicket);
      expect((persistCall as WechatLoginTicket).userId).toBe(userId);
    });
  });

  describe('handleCallback', () => {
    const mockCode = 'wechat-code-123';
    const mockState = 'ticket-uuid-123';
    const mockOpenid = 'openid-123';
    const mockAccessToken = 'wechat-access-token';
    const mockWechatUserInfo: WechatUserInfo = {
      openid: mockOpenid,
      nickname: '测试用户',
      headimgurl: 'https://example.com/avatar.jpg',
      sex: 1,
      province: '北京',
      city: '北京',
      country: '中国',
    };

    it('应该成功处理微信回调并创建新用户', async () => {
      // 准备测试数据
      const ticket = new WechatLoginTicket();
      ticket.ticket = mockState;
      ticket.status = 'pending';
      ticket.expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const tokens = {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
      };

      const newUser = {
        id: 'user-123',
        email: 'wechat@example.com',
        username: 'wechat_user',
        wechatOpenid: mockOpenid,
        profile: { name: '测试用户' } as Profile,
      } as User;

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticket);
      userRepository.findOne = jest.fn().mockResolvedValue(null); // 用户不存在
      authService.createWechatUser = jest.fn().mockResolvedValue(newUser);
      authService.generateTokens = jest.fn().mockResolvedValue(tokens);
      mockFirstValueFrom
        .mockResolvedValueOnce({
          data: {
            access_token: mockAccessToken,
            openid: mockOpenid,
          },
        })
        .mockResolvedValueOnce({
          data: mockWechatUserInfo,
        });

      // 执行测试
      await service.handleCallback(mockCode, mockState);

      // 验证结果
      expect(ticket.status).toBe('success');
      expect(ticket.code).toBe(mockCode);
      expect(ticket.openid).toBe(mockOpenid);
      expect(ticket.userInfo).toEqual(mockWechatUserInfo);
      expect(ticket.userId).toBe(newUser.id);
      expect(authService.createWechatUser).toHaveBeenCalledWith(
        mockOpenid,
        mockWechatUserInfo,
      );
      expect(authService.generateTokens).toHaveBeenCalledWith(newUser);
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('应该在票据不存在时抛出异常', async () => {
      ticketRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.handleCallback(mockCode, mockState)).rejects.toThrow(
        GeneralBadRequestException,
      );
      await expect(service.handleCallback(mockCode, mockState)).rejects.toThrow(
        '无效的登录票据',
      );
    });

    it('应该在票据已使用时抛出异常', async () => {
      const ticket = new WechatLoginTicket();
      ticket.ticket = mockState;
      ticket.status = 'success'; // 已使用

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticket);

      // 执行测试并验证异常
      await expect(service.handleCallback(mockCode, mockState)).rejects.toThrow(
        GeneralBadRequestException,
      );
      await expect(service.handleCallback(mockCode, mockState)).rejects.toThrow(
        '登录票据已使用',
      );
    });

    it('应该在票据已过期时抛出异常', async () => {
      const ticket = new WechatLoginTicket();
      ticket.ticket = mockState;
      ticket.status = 'pending';
      ticket.expiresAt = new Date(Date.now() - 1000); // 已过期

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticket);

      // 执行测试并验证异常
      await expect(service.handleCallback(mockCode, mockState)).rejects.toThrow(
        GeneralBadRequestException,
      );
      await expect(service.handleCallback(mockCode, mockState)).rejects.toThrow(
        '登录票据已过期',
      );
    });

    it('应该在微信授权失败时抛出异常', async () => {
      const ticket = new WechatLoginTicket();
      ticket.ticket = mockState;
      ticket.status = 'pending';
      ticket.expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticket);
      mockFirstValueFrom.mockResolvedValueOnce({
        data: {
          errcode: 40029,
          errmsg: 'invalid code',
        },
      });

      // 执行测试并验证异常
      await expect(service.handleCallback(mockCode, mockState)).rejects.toThrow(
        GeneralUnauthorizedException,
      );

      // 验证 ticket 状态被更新为 failed
      expect(ticket.status).toBe('failed');
    });

    it('应该成功处理绑定模式的回调', async () => {
      // 准备测试数据
      const userId = 'user-123';
      const ticket = new WechatLoginTicket();
      ticket.ticket = mockState;
      ticket.status = 'pending';
      ticket.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      ticket.userId = userId; // 绑定模式

      const existingUser = {
        id: userId,
        email: 'existing@example.com',
        username: 'existing_user',
        profile: { name: 'Existing User' } as Profile,
      } as User;

      const tokens = {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
      };

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticket);
      userRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(null) // 没有通过 openid 找到用户
        .mockResolvedValueOnce(existingUser); // 通过 userId 找到用户
      authService.generateTokens = jest.fn().mockResolvedValue(tokens);
      mockFirstValueFrom
        .mockResolvedValueOnce({
          data: {
            access_token: mockAccessToken,
            openid: mockOpenid,
          },
        })
        .mockResolvedValueOnce({
          data: mockWechatUserInfo,
        });

      // 执行测试
      await service.handleCallback(mockCode, mockState);

      // 验证结果
      expect(existingUser.wechatOpenid).toBe(mockOpenid);
      expect(ticket.status).toBe('success');
      expect(authService.createWechatUser).not.toHaveBeenCalled();
    });
  });

  describe('getLoginStatus', () => {
    it('应该成功获取待处理状态', async () => {
      // 准备测试数据
      const ticket = 'ticket-123';
      const ticketEntity = new WechatLoginTicket();
      ticketEntity.ticket = ticket;
      ticketEntity.status = 'pending';
      ticketEntity.expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticketEntity);

      // 执行测试
      const result = await service.getLoginStatus(ticket);

      // 验证结果
      expect(result.status).toBe('pending');
      expect(result.ticket).toBe(ticket);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('应该成功获取成功状态和用户数据', async () => {
      // 准备测试数据
      const ticket = 'ticket-123';
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      } as User;

      const tokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      const ticketEntity = new WechatLoginTicket();
      ticketEntity.ticket = ticket;
      ticketEntity.status = 'success';
      ticketEntity.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      ticketEntity.user = user;
      ticketEntity.tokens = tokens;

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticketEntity);

      // 执行测试
      const result = await service.getLoginStatus(ticket);

      // 验证结果
      expect(result.status).toBe('success');
      expect(result.ticket).toBe(ticket);
      expect(result.data).toEqual({ user, tokens });
      expect(result.error).toBeUndefined();
    });

    it('应该成功获取失败状态和错误信息', async () => {
      // 准备测试数据
      const ticket = 'ticket-123';
      const ticketEntity = new WechatLoginTicket();
      ticketEntity.ticket = ticket;
      ticketEntity.status = 'failed';
      ticketEntity.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      ticketEntity.error = '授权失败';

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticketEntity);

      // 执行测试
      const result = await service.getLoginStatus(ticket);

      // 验证结果
      expect(result.status).toBe('failed');
      expect(result.ticket).toBe(ticket);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('授权失败');
    });

    it('应该在票据不存在时抛出异常', async () => {
      ticketRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.getLoginStatus('invalid-ticket')).rejects.toThrow(
        GeneralBadRequestException,
      );
    });

    it('应该在票据已过期时抛出异常', async () => {
      const ticketEntity = new WechatLoginTicket();
      ticketEntity.ticket = 'ticket-123';
      ticketEntity.status = 'pending';
      ticketEntity.expiresAt = new Date(Date.now() - 1000); // 已过期

      ticketRepository.findOne = jest.fn().mockResolvedValue(ticketEntity);

      // 执行测试并验证异常
      await expect(service.getLoginStatus('ticket-123')).rejects.toThrow(
        GeneralBadRequestException,
      );
    });
  });
});
