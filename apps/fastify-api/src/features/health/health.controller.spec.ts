import { User } from '@/features/users/entities/user.entity';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { HttpModule } from '@nestjs/axios';
import {
  DiskHealthIndicator,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

/**
 * HealthController 的单元测试套件。
 *
 * @description 测试健康检查控制器的各个端点，包括：
 * - HTTP 服务健康检查
 * - 数据库连接健康检查
 * - 磁盘存储健康检查
 * - 内存使用健康检查
 */
describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let httpHealthIndicator: jest.Mocked<HttpHealthIndicator>;
  let diskHealthIndicator: jest.Mocked<DiskHealthIndicator>;
  let memoryHealthIndicator: jest.Mocked<MemoryHealthIndicator>;
  let userRepository: jest.Mocked<EntityRepository<User>>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    // 创建模拟的 EntityManager
    entityManager = {
      getConnection: jest.fn().mockReturnValue({
        execute: jest.fn(),
      }),
    } as unknown as jest.Mocked<EntityManager>;

    // 创建模拟的 UserRepository
    userRepository = {
      getEntityManager: jest.fn().mockReturnValue(entityManager),
    } as unknown as jest.Mocked<EntityRepository<User>>;

    // 创建模拟的健康检查服务
    healthCheckService = {
      check: jest.fn(),
    } as unknown as jest.Mocked<HealthCheckService>;

    // 创建模拟的 HTTP 健康指示器
    httpHealthIndicator = {
      pingCheck: jest.fn(),
    } as unknown as jest.Mocked<HttpHealthIndicator>;

    // 创建模拟的磁盘健康指示器
    diskHealthIndicator = {
      checkStorage: jest.fn(),
    } as unknown as jest.Mocked<DiskHealthIndicator>;

    // 创建模拟的内存健康指示器
    memoryHealthIndicator = {
      checkHeap: jest.fn(),
    } as unknown as jest.Mocked<MemoryHealthIndicator>;

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckService,
        },
        {
          provide: HttpHealthIndicator,
          useValue: httpHealthIndicator,
        },
        {
          provide: DiskHealthIndicator,
          useValue: diskHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: memoryHealthIndicator,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('应该执行 HTTP ping 健康检查', async () => {
      // 准备测试数据
      const expectedResult = {
        status: 'ok',
        info: {
          'aung pyae phyo': {
            status: 'up',
          },
        },
      };
      httpHealthIndicator.pingCheck = jest.fn().mockResolvedValue({
        'aung pyae phyo': { status: 'up' },
      });
      // healthCheckService.check 会调用传入的函数数组
      healthCheckService.check = jest
        .fn()
        .mockImplementation(async (checks) => {
          const results = await Promise.all(
            checks.map((check: () => Promise<any>) => check()),
          );
          return {
            status: 'ok',
            info: Object.assign({}, ...results),
          };
        });

      // 执行测试
      const result = await controller.check();

      // 验证结果
      expect(result.status).toBe('ok');
      expect(result.info?.['aung pyae phyo']?.status).toBe('up');
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(httpHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'aung pyae phyo',
        'https://www.aungpyaephyo.com',
      );
    });
  });

  describe('checkDisk', () => {
    it('应该执行磁盘存储健康检查', async () => {
      // 准备测试数据
      const expectedResult = {
        status: 'ok',
        info: {
          storage: {
            status: 'up',
          },
        },
      };
      diskHealthIndicator.checkStorage = jest.fn().mockResolvedValue({
        storage: { status: 'up' },
      });
      // healthCheckService.check 会调用传入的函数数组
      healthCheckService.check = jest
        .fn()
        .mockImplementation(async (checks) => {
          const results = await Promise.all(
            checks.map((check: () => Promise<any>) => check()),
          );
          return {
            status: 'ok',
            info: Object.assign({}, ...results),
          };
        });

      // 执行测试
      const result = await controller.checkDisk();

      // 验证结果
      expect(result.status).toBe('ok');
      expect(result.info?.storage?.status).toBe('up');
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith('storage', {
        path: '/',
        thresholdPercent: 0.5,
      });
    });
  });

  describe('checkMemory', () => {
    it('应该执行内存堆健康检查', async () => {
      // 准备测试数据
      const expectedResult = {
        status: 'ok',
        info: {
          memory_heap: {
            status: 'up',
          },
        },
      };
      memoryHealthIndicator.checkHeap = jest.fn().mockResolvedValue({
        memory_heap: { status: 'up' },
      });
      // healthCheckService.check 会调用传入的函数数组
      healthCheckService.check = jest
        .fn()
        .mockImplementation(async (checks) => {
          const results = await Promise.all(
            checks.map((check: () => Promise<any>) => check()),
          );
          return {
            status: 'ok',
            info: Object.assign({}, ...results),
          };
        });

      // 执行测试
      const result = await controller.checkMemory();

      // 验证结果
      expect(result.status).toBe('ok');
      expect(result.info?.memory_heap?.status).toBe('up');
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        150 * 1024 * 1024,
      );
    });
  });

  describe('checkDatabase', () => {
    it('应该在数据库连接正常时返回健康状态', async () => {
      // 准备测试数据
      const expectedResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
      };
      entityManager.getConnection().execute = jest
        .fn()
        .mockResolvedValue(undefined);
      // healthCheckService.check 会调用传入的函数数组，我们需要模拟这个行为
      healthCheckService.check = jest
        .fn()
        .mockImplementation(async (checks) => {
          const results = await Promise.all(
            checks.map((check: () => Promise<any>) => check()),
          );
          return {
            status: 'ok',
            info: Object.assign({}, ...results),
          };
        });

      // 执行测试
      const result = await controller.checkDatabase();

      // 验证结果
      expect(result.status).toBe('ok');
      expect(result.info?.database?.status).toBe('up');
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(entityManager.getConnection().execute).toHaveBeenCalledWith(
        'SELECT 1',
      );
    });

    it('应该在数据库连接失败时返回不健康状态', async () => {
      // 准备测试数据
      const error = new Error('数据库连接失败');
      entityManager.getConnection().execute = jest
        .fn()
        .mockRejectedValue(error);
      // healthCheckService.check 会调用传入的函数数组，我们需要模拟这个行为
      healthCheckService.check = jest
        .fn()
        .mockImplementation(async (checks) => {
          const results = await Promise.all(
            checks.map((check: () => Promise<any>) => check()),
          );
          return {
            status: 'error',
            error: Object.assign({}, ...results),
          };
        });

      // 执行测试
      const result = await controller.checkDatabase();

      // 验证结果
      expect(result.error?.database?.status).toBe('down');
      expect(result.error?.database?.message).toBe(error.message);
      expect(entityManager.getConnection().execute).toHaveBeenCalledWith(
        'SELECT 1',
      );
    });

    it('应该处理未知类型的错误', async () => {
      // 准备测试数据
      const unknownError = '未知错误';
      entityManager.getConnection().execute = jest
        .fn()
        .mockRejectedValue(unknownError);
      // healthCheckService.check 会调用传入的函数数组，我们需要模拟这个行为
      healthCheckService.check = jest
        .fn()
        .mockImplementation(async (checks) => {
          const results = await Promise.all(
            checks.map((check: () => Promise<any>) => check()),
          );
          return {
            status: 'error',
            error: Object.assign({}, ...results),
          };
        });

      // 执行测试
      const result = await controller.checkDatabase();

      // 验证结果
      expect(result.error?.database?.status).toBe('down');
      expect(result.error?.database?.message).toBe('Unknown error');
    });
  });
});
