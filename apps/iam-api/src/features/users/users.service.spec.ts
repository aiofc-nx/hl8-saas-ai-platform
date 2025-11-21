import { GeneralNotFoundException } from '@hl8/exceptions';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { Profile } from './entities/profile.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

/**
 * UsersService 的单元测试套件。
 *
 * @description 测试用户服务的核心功能，包括：
 * - 获取所有用户
 * - 根据标识符查找用户
 * - 用户不存在时的异常处理
 */
describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<EntityRepository<User>>;

  beforeEach(async () => {
    // 创建模拟的 UserRepository
    userRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityRepository<User>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('应该成功返回所有用户及其个人资料', async () => {
      // 准备测试数据
      const users = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          profile: { id: '1', name: 'User 1' } as Profile,
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          profile: { id: '2', name: 'User 2' } as Profile,
        },
      ] as User[];

      userRepository.findAll = jest.fn().mockResolvedValue(users);

      // 执行测试
      const result = await service.findAll();

      // 验证结果
      expect(result).toEqual(users);
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
      expect(userRepository.findAll).toHaveBeenCalledWith({
        populate: ['profile'],
      });
    });

    it('应该在没有任何用户时返回空数组', async () => {
      // 准备测试数据
      userRepository.findAll = jest.fn().mockResolvedValue([]);

      // 执行测试
      const result = await service.findAll();

      // 验证结果
      expect(result).toEqual([]);
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('应该成功根据用户名查找用户', async () => {
      // 准备测试数据
      const identifier = 'testuser';
      const user = {
        id: '1',
        username: identifier,
        email: 'testuser@example.com',
        profile: { id: '1', name: 'Test User' } as Profile,
      } as User;

      userRepository.findOne = jest.fn().mockResolvedValue(user);

      // 执行测试
      const result = await service.findOne(identifier);

      // 验证结果
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(
        { username: identifier },
        { populate: ['profile'] },
      );
    });

    it('应该在用户不存在时抛出 NotFoundException', async () => {
      // 准备测试数据
      const identifier = 'nonexistent';

      userRepository.findOne = jest.fn().mockResolvedValue(null);

      // 执行测试并验证异常
      await expect(service.findOne(identifier)).rejects.toThrow(
        GeneralNotFoundException,
      );
      await expect(service.findOne(identifier)).rejects.toThrow('用户不存在');
      expect(userRepository.findOne).toHaveBeenCalledWith(
        { username: identifier },
        { populate: ['profile'] },
      );
    });
  });
});
