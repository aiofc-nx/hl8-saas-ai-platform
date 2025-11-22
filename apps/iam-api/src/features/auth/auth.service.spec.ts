import * as utils from '@/common/utils';
import { EnvConfig } from '@/common/utils/validateEnv';
import { TransactionService } from '@/database';
import { Profile } from '@/features/users/entities/profile.entity';
import { User } from '@/features/users/entities/user.entity';
import {
  GeneralBadRequestException,
  GeneralNotFoundException,
  GeneralUnauthorizedException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { MailService } from '@hl8/mail';
import { getRepositoryToken } from '@hl8/mikro-orm-nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {
  ConfirmEmailDto,
  CreateUserDto,
  RefreshTokenDto,
  SignInUserDto,
  SignOutUserDto,
  ValidateUserDto,
} from './dto';
import { Otp, TokenTypes } from './entities/otp.entity';
import { Session } from './entities/session.entity';

// Mock @repo/constants/app 模块
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
}));

// Mock 工具函数
jest.mock('@/common/utils', () => ({
  ...jest.requireActual('@/common/utils'),
  generateOTP: jest.fn(),
  hashString: jest.fn(),
  validateString: jest.fn(),
  extractName: jest.fn(),
  generateRefreshTime: jest.fn(),
}));

/**
 * AuthService 的单元测试套件。
 *
 * @description 测试认证服务的核心功能，包括：
 * - 令牌生成
 * - 用户验证
 * - 用户注册
 * - 用户登录
 * - 密码重置和修改
 * - 会话管理
 */
describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let config: EnvConfig;
  let userRepository: jest.Mocked<EntityRepository<User>>;
  let profileRepository: jest.Mocked<EntityRepository<Profile>>;
  let sessionRepository: jest.Mocked<EntityRepository<Session>>;
  let otpRepository: jest.Mocked<EntityRepository<Otp>>;
  let transactionService: jest.Mocked<TransactionService>;
  let mailService: jest.Mocked<MailService>;
  let logger: jest.Mocked<Logger>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    // 创建模拟的 EntityManager
    entityManager = {
      findOne: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      remove: jest.fn(),
      nativeDelete: jest.fn(),
      getConnection: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // 创建模拟的仓库
    userRepository = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      getEntityManager: jest.fn().mockReturnValue(entityManager),
    } as unknown as jest.Mocked<EntityRepository<User>>;

    profileRepository = {
      findOne: jest.fn(),
      getEntityManager: jest.fn().mockReturnValue(entityManager),
    } as unknown as jest.Mocked<EntityRepository<Profile>>;

    sessionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      getEntityManager: jest.fn().mockReturnValue(entityManager),
    } as unknown as jest.Mocked<EntityRepository<Session>>;

    otpRepository = {
      findOne: jest.fn(),
      getEntityManager: jest.fn().mockReturnValue(entityManager),
    } as unknown as jest.Mocked<EntityRepository<Otp>>;

    // 创建模拟的服务
    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    config = {
      ACCESS_TOKEN_SECRET: 'test-access-secret',
      ACCESS_TOKEN_EXPIRATION: '15m',
      REFRESH_TOKEN_SECRET: 'test-refresh-secret',
      REFRESH_TOKEN_EXPIRATION: '7d',
    } as EnvConfig;

    transactionService = {
      runInTransaction: jest.fn(),
    } as unknown as jest.Mocked<TransactionService>;

    mailService = {
      sendEmail: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: EnvConfig,
          useValue: config,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: profileRepository,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: sessionRepository,
        },
        {
          provide: getRepositoryToken(Otp),
          useValue: otpRepository,
        },
        {
          provide: TransactionService,
          useValue: transactionService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // 重置所有工具函数的 mock
    (utils.generateOTP as jest.Mock).mockReset();
    (utils.hashString as jest.Mock).mockReset();
    (utils.validateString as jest.Mock).mockReset();
    (utils.extractName as jest.Mock).mockReset();
    (utils.generateRefreshTime as jest.Mock).mockReset();
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokens', () => {
    it('应该成功生成访问令牌和刷新令牌', async () => {
      // 准备测试数据
      const user = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      } as User;

      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      jwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      // 执行测试
      const result = await service.generateTokens(user);

      // 验证结果
      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          username: user.username,
          email: user.email,
          id: user.id,
        },
        {
          secret: 'test-access-secret',
          expiresIn: '15m',
        },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          username: user.username,
          email: user.email,
          id: user.id,
        },
        {
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        },
      );
    });
  });

  describe('validateUser', () => {
    it('应该成功验证有效的用户凭据', async () => {
      // 准备测试数据
      const dto: ValidateUserDto = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed-password',
        profile: {} as Profile,
      } as User;

      entityManager.findOne = jest.fn().mockResolvedValue(user);
      (utils.validateString as jest.Mock).mockResolvedValue(true);

      // 执行测试
      const result = await service.validateUser(dto);

      // 验证结果
      expect(result).toEqual(user);
      expect(entityManager.findOne).toHaveBeenCalledWith(
        User,
        {
          $or: [{ email: dto.identifier }, { username: dto.identifier }],
        },
        { populate: ['profile'] },
      );
    });

    it('应该在用户不存在时抛出 UnauthorizedException', async () => {
      // 准备测试数据
      const dto: ValidateUserDto = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      entityManager.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.validateUser(dto)).rejects.toThrow(
        GeneralUnauthorizedException,
      );
      await expect(service.validateUser(dto)).rejects.toThrow(
        '用户名或密码错误',
      );
    });

    it('应该在密码无效时抛出 UnauthorizedException', async () => {
      // 准备测试数据
      const dto: ValidateUserDto = {
        identifier: 'test@example.com',
        password: 'wrong-password',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        profile: {} as Profile,
      } as User;

      entityManager.findOne = jest.fn().mockResolvedValue(user);
      (utils.validateString as jest.Mock).mockResolvedValue(false);

      // 执行测试并验证异常
      await expect(service.validateUser(dto)).rejects.toThrow(
        GeneralUnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // 准备测试数据
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const userId = '1';
      const profile = { id: '1', name: 'newuser' } as Profile;
      const otp = { id: '1', otp: '123456' } as Otp;
      const createdUser = {
        id: userId,
        email: createUserDto.email,
        username: 'newuser',
        profile,
      } as User;

      // 第一次调用：检查用户是否存在（返回 null 表示不存在）
      // 第二次调用：获取创建的用户
      userRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createdUser);
      // 模拟 getEntityManager().refresh()
      entityManager.refresh = jest.fn().mockResolvedValue(undefined);
      transactionService.runInTransaction = jest
        .fn()
        .mockResolvedValue({ userId, profile, otp });
      (utils.generateOTP as jest.Mock).mockResolvedValue('123456');
      (utils.hashString as jest.Mock).mockResolvedValue('hashed-password');
      (utils.extractName as jest.Mock).mockReturnValue('newuser');
      mailService.sendEmail = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await service.register(createUserDto);

      // 验证结果
      expect(result.data).toEqual(createdUser);
      expect(transactionService.runInTransaction).toHaveBeenCalledTimes(1);
      expect(mailService.sendEmail).toHaveBeenCalled();
    });

    it('应该在用户名或邮箱已存在时抛出 BadRequestException', async () => {
      // 准备测试数据
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const existingUser = {
        id: '1',
        email: 'existing@example.com',
      } as User;

      userRepository.findOne = jest.fn().mockResolvedValue(existingUser);
      (utils.generateOTP as jest.Mock).mockResolvedValue('123456');

      // 执行测试并验证异常
      await expect(service.register(createUserDto)).rejects.toThrow(
        GeneralBadRequestException,
      );
      await expect(service.register(createUserDto)).rejects.toThrow(
        '注册失败，用户名或邮箱已被使用',
      );
    });
  });

  describe('signIn', () => {
    it('应该成功登录用户', async () => {
      // 准备测试数据
      const signInDto: SignInUserDto = {
        identifier: 'test@example.com',
        password: 'password123',
        ip: '127.0.0.1',
        device_name: 'Test Device',
        device_os: 'Linux',
        browser: 'Chrome',
        location: 'Test Location',
        userAgent: 'Test User Agent',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed-password',
        profile: { name: 'Test User' } as Profile,
      } as User;

      const tokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(tokens);
      (utils.generateRefreshTime as jest.Mock).mockResolvedValue(
        new Date().toISOString(),
      );
      mailService.sendEmail = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      const result = await service.signIn(signInDto);

      // 验证结果
      expect(result.data).toEqual(user);
      expect(result.tokens).toHaveProperty('access_token');
      expect(result.tokens).toHaveProperty('refresh_token');
      expect(result.tokens).toHaveProperty('session_token');
      expect(mailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('confirmEmail', () => {
    it('应该成功确认用户邮箱', async () => {
      // 准备测试数据
      const dto: ConfirmEmailDto = {
        email: 'test@example.com',
        token: '123456',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        isEmailVerified: false,
        profile: { name: 'Test User' } as Profile,
      } as User;

      const otp = {
        id: '1',
        otp: '123456',
        type: TokenTypes.EMAIL_CONFIRMATION,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
      } as Otp;

      userRepository.findOne = jest.fn().mockResolvedValue(user);
      otpRepository.findOne = jest.fn().mockResolvedValue(otp);
      mailService.sendEmail = jest.fn().mockResolvedValue(undefined);

      // 执行测试
      await service.confirmEmail(dto);

      // 验证结果
      expect(user.isEmailVerified).toBe(true);
      expect(mailService.sendEmail).toHaveBeenCalled();
    });

    it('应该在用户不存在时抛出 NotFoundException', async () => {
      // 准备测试数据
      const dto: ConfirmEmailDto = {
        email: 'test@example.com',
        token: '123456',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.confirmEmail(dto)).rejects.toThrow(
        GeneralNotFoundException,
      );
    });

    it('应该在 OTP 无效时抛出异常', async () => {
      // 准备测试数据
      const dto: ConfirmEmailDto = {
        email: 'test@example.com',
        token: '123456',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
      } as User;

      userRepository.findOne = jest.fn().mockResolvedValue(user);
      otpRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.confirmEmail(dto)).rejects.toThrow(
        GeneralNotFoundException,
      );
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新令牌', async () => {
      // 准备测试数据
      const dto: RefreshTokenDto = {
        user_id: '1',
        session_token: 'session-1',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      } as User;

      const session = {
        id: 'session-1',
        user: { id: '1' } as User,
        refresh_token: 'old-refresh-token',
      } as Session;

      const tokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(user);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(tokens);
      sessionRepository.findOne = jest.fn().mockResolvedValue(session);
      (utils.generateRefreshTime as jest.Mock).mockResolvedValue(
        new Date().toISOString(),
      );

      // 执行测试
      const result = await service.refreshToken(dto);

      // 验证结果
      expect(result.access_token).toBe(tokens.access_token);
      expect(result.refresh_token).toBe(tokens.refresh_token);
      expect(result.session_token).toBe(dto.session_token);
      expect(session.refresh_token).toBe(tokens.refresh_token);
    });

    it('应该在用户不存在时抛出 NotFoundException', async () => {
      // 准备测试数据
      const dto: RefreshTokenDto = {
        user_id: '1',
        session_token: 'session-1',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.refreshToken(dto)).rejects.toThrow(
        GeneralNotFoundException,
      );
    });
  });

  describe('signOut', () => {
    it('应该成功登出用户', async () => {
      // 准备测试数据
      const dto: SignOutUserDto = {
        session_token: 'session-1',
      };

      const session = {
        id: 'session-1',
        user: { id: '1' } as User,
      } as Session;

      sessionRepository.findOne = jest.fn().mockResolvedValue(session);

      // 执行测试
      await service.signOut(dto);

      // 验证结果
      expect(entityManager.remove).toHaveBeenCalledWith(session);
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('应该在会话不存在时抛出 NotFoundException', async () => {
      // 准备测试数据
      const dto: SignOutUserDto = {
        session_token: 'session-1',
      };

      sessionRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.signOut(dto)).rejects.toThrow(
        GeneralNotFoundException,
      );
    });
  });

  describe('getSessions', () => {
    it('应该成功获取用户的所有会话', async () => {
      // 准备测试数据
      const userId = '1';
      const sessions = [
        { id: 'session-1', user: { id: userId } } as Session,
        { id: 'session-2', user: { id: userId } } as Session,
      ];

      sessionRepository.find = jest.fn().mockResolvedValue(sessions);

      // 执行测试
      const result = await service.getSessions(userId);

      // 验证结果
      expect(result).toEqual(sessions);
      expect(sessionRepository.find).toHaveBeenCalledWith({
        user: userId,
      });
    });
  });

  describe('getSession', () => {
    it('应该成功获取单个会话', async () => {
      // 准备测试数据
      const sessionId = 'session-1';
      const session = {
        id: sessionId,
        user: { id: '1' } as User,
      } as Session;

      sessionRepository.findOne = jest.fn().mockResolvedValue(session);

      // 执行测试
      const result = await service.getSession(sessionId);

      // 验证结果
      expect(result).toEqual(session);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({ id: sessionId });
    });

    it('应该在会话不存在时抛出 NotFoundException', async () => {
      // 准备测试数据
      const sessionId = 'session-1';

      sessionRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.getSession(sessionId)).rejects.toThrow(
        GeneralNotFoundException,
      );
    });
  });
});
