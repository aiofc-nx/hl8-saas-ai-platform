import { Session } from '@/features/auth/entities/session.entity';
import { User } from '@/features/users/entities/user.entity';
import { getRepositoryToken } from '@hl8/mikro-orm-nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionVerifierService } from './session-verifier.service';

// Mock @repo/constants/app 模块
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
}));

/**
 * SessionVerifierService 的单元测试套件。
 *
 * @description 测试会话验证器服务的核心功能，包括：
 * - 验证会话是否存在
 * - 处理无效的刷新令牌
 * - 处理不存在的用户 ID
 */
describe('SessionVerifierService', () => {
  let service: SessionVerifierService;
  let sessionRepository: jest.Mocked<EntityRepository<Session>>;

  beforeEach(async () => {
    // 创建模拟的会话仓库
    sessionRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityRepository<Session>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionVerifierService,
        {
          provide: getRepositoryToken(Session),
          useValue: sessionRepository,
        },
      ],
    }).compile();

    service = module.get<SessionVerifierService>(SessionVerifierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('verifySession', () => {
    it('应该在会话存在时返回 true', async () => {
      // 准备测试数据
      const token = 'refresh-token-123';
      const userId = 'user-123';

      const session = {
        id: 'session-123',
        refresh_token: token,
        user: { id: userId } as User,
      } as Session;

      sessionRepository.findOne = jest.fn().mockResolvedValue(session);

      // 执行测试
      const result = await service.verifySession(token, userId);

      // 验证结果
      expect(result).toBe(true);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        refresh_token: token,
        user: userId,
      });
    });

    it('应该在会话不存在时返回 false', async () => {
      // 准备测试数据
      const token = 'invalid-refresh-token';
      const userId = 'user-123';

      sessionRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试
      const result = await service.verifySession(token, userId);

      // 验证结果
      expect(result).toBe(false);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        refresh_token: token,
        user: userId,
      });
    });

    it('应该正确处理不同用户 ID 的会话', async () => {
      // 准备测试数据
      const token = 'refresh-token-123';
      const userId = 'user-456';

      sessionRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试
      const result = await service.verifySession(token, userId);

      // 验证结果
      expect(result).toBe(false);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        refresh_token: token,
        user: userId,
      });
    });

    it('应该正确处理空字符串参数', async () => {
      // 准备测试数据
      const token = '';
      const userId = '';

      sessionRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试
      const result = await service.verifySession(token, userId);

      // 验证结果
      expect(result).toBe(false);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        refresh_token: token,
        user: userId,
      });
    });
  });
});
