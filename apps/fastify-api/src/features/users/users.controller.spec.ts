import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FileService } from '@/features/file/file.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { MemoryStorageFile } from '@blazity/nest-file-fastify';

/**
 * UsersController 的单元测试套件。
 *
 * @description 测试用户控制器的各个端点，包括：
 * - 获取所有用户
 * - 根据标识符获取单个用户
 * - 文件上传测试
 */
describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let fileService: jest.Mocked<FileService>;

  beforeEach(async () => {
    // 创建模拟的 UsersService
    usersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    // 创建模拟的 FileService
    fileService = {
      uploadFile: jest.fn(),
    } as unknown as jest.Mocked<FileService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: FileService,
          useValue: fileService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('应该成功返回所有用户（不包含密码）', async () => {
      // 准备测试数据
      const users = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          password: 'hashed-password-1',
          profile: { id: '1', name: 'User 1' } as Profile,
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          password: 'hashed-password-2',
          profile: { id: '2', name: 'User 2' } as Profile,
        },
      ] as User[];

      usersService.findAll = jest.fn().mockResolvedValue(users);

      // 执行测试
      const result = await controller.findAll();

      // 验证结果
      expect(result.message).toBe('Users fetched successfully');
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).not.toHaveProperty('password');
      expect(result.data[1]).not.toHaveProperty('password');
      expect(result.data[0]).toHaveProperty('id', '1');
      expect(result.data[0]).toHaveProperty('username', 'user1');
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
    });

    it('应该在没有任何用户时返回空数组', async () => {
      // 准备测试数据
      usersService.findAll = jest.fn().mockResolvedValue([]);

      // 执行测试
      const result = await controller.findAll();

      // 验证结果
      expect(result.message).toBe('Users fetched successfully');
      expect(result.data).toEqual([]);
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('应该成功根据标识符查找用户（不包含密码）', async () => {
      // 准备测试数据
      const identifier = 'testuser';
      const user = {
        id: '1',
        username: identifier,
        email: 'testuser@example.com',
        password: 'hashed-password',
        profile: { id: '1', name: 'Test User' } as Profile,
      } as User;

      usersService.findOne = jest.fn().mockResolvedValue(user);

      // 执行测试
      const result = await controller.findOne(identifier);

      // 验证结果
      expect(result.message).toBe('User fetched successfully');
      expect(result.data).not.toHaveProperty('password');
      expect(result.data).toHaveProperty('id', '1');
      expect(result.data).toHaveProperty('username', identifier);
      expect(usersService.findOne).toHaveBeenCalledWith(identifier);
    });
  });

  describe('fileTesting', () => {
    it('应该成功上传文件', async () => {
      // 准备测试数据
      const file = {
        buffer: Buffer.from('test file content'),
        mimetype: 'image/png',
        fieldname: 'file',
        originalname: 'test.png',
        encoding: '7bit',
        size: 1024,
      } as MemoryStorageFile;

      const uploadResult = {
        filename: 'test.png',
        filepath: 'uploads/test.png',
      };

      fileService.uploadFile = jest.fn().mockResolvedValue(uploadResult);

      // 执行测试
      const result = await controller.fileTesting(file);

      // 验证结果
      expect(result).toEqual(uploadResult);
      expect(fileService.uploadFile).toHaveBeenCalledWith(file);
    });
  });
});

