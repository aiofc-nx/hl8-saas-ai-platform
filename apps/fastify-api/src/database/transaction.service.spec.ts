import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/postgresql';
import { TransactionService } from './transaction.service';

/**
 * TransactionService 的单元测试套件。
 *
 * @description 测试事务服务的核心功能，包括：
 * - 事务执行成功场景
 * - 事务回滚场景
 * - EntityManager 的正确传递
 */
describe('TransactionService', () => {
  let service: TransactionService;
  let mockOrm: jest.Mocked<MikroORM>;
  let mockEm: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    // 创建模拟的 EntityManager
    mockEm = {
      transactional: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // 创建模拟的 MikroORM
    mockOrm = {
      em: mockEm,
    } as unknown as jest.Mocked<MikroORM>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: MikroORM,
          useValue: mockOrm,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('runInTransaction', () => {
    it('应该成功执行事务并返回结果', async () => {
      // 准备测试数据
      const expectedResult = { id: 1, name: 'test' };
      const mockFn = jest.fn().mockResolvedValue(expectedResult);

      // 模拟 transactional 方法的行为
      mockEm.transactional = jest.fn().mockImplementation(async (callback) => {
        // 传递事务感知的 EntityManager 给回调函数
        return callback(mockEm);
      });

      // 执行测试
      const result = await service.runInTransaction(mockFn);

      // 验证结果
      expect(result).toEqual(expectedResult);
      expect(mockEm.transactional).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(mockEm);
    });

    it('应该在函数抛出异常时回滚事务', async () => {
      // 准备测试数据
      const error = new Error('测试错误');
      const mockFn = jest.fn().mockRejectedValue(error);

      // 模拟 transactional 方法在异常时回滚
      mockEm.transactional = jest.fn().mockImplementation(async (callback) => {
        try {
          return await callback(mockEm);
        } catch (e) {
          // MikroORM 会自动回滚，这里只是模拟
          throw e;
        }
      });

      // 执行测试并验证异常
      await expect(service.runInTransaction(mockFn)).rejects.toThrow(error);
      expect(mockEm.transactional).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('应该正确传递 EntityManager 给回调函数', async () => {
      // 准备测试数据
      const mockFn = jest.fn().mockResolvedValue(undefined);
      let receivedEm: EntityManager | undefined;

      // 模拟 transactional 方法
      mockEm.transactional = jest.fn().mockImplementation(async (callback) => {
        receivedEm = mockEm;
        return callback(mockEm);
      });

      // 执行测试
      await service.runInTransaction(mockFn);

      // 验证 EntityManager 被正确传递
      expect(mockFn).toHaveBeenCalledWith(receivedEm);
      expect(receivedEm).toBe(mockEm);
    });

    it('应该支持异步操作', async () => {
      // 准备测试数据
      const expectedResult = { data: 'async result' };
      const mockFn = jest.fn().mockImplementation(
        async (em: EntityManager) => {
          // 模拟异步操作
          await new Promise((resolve) => setTimeout(resolve, 10));
          return expectedResult;
        },
      );

      // 模拟 transactional 方法
      mockEm.transactional = jest.fn().mockImplementation(async (callback) => {
        return callback(mockEm);
      });

      // 执行测试
      const result = await service.runInTransaction(mockFn);

      // 验证结果
      expect(result).toEqual(expectedResult);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});

