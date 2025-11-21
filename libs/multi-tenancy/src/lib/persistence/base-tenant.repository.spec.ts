import { GeneralForbiddenException } from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type {
  EntityData,
  EntityManager,
  EntityName,
  EntityRepository,
  FilterQuery,
  FindOneOptions,
} from '@mikro-orm/core';
import { TenantContextExecutor } from '../tenant-context.executor.js';
import { BaseTenantRepository } from './base-tenant.repository.js';

// 测试实体接口
interface TestEntity {
  id: string;
  tenantId: string;
  name: string;
}

// 测试仓储类
class TestTenantRepository extends BaseTenantRepository<TestEntity> {
  public async findOnePublic(
    where: FilterQuery<TestEntity>,
    options?: FindOneOptions<TestEntity>,
  ): Promise<TestEntity | null> {
    return this.findOne(where, options);
  }

  public async nativeUpdatePublic(
    where: FilterQuery<TestEntity>,
    data: EntityData<TestEntity>,
  ): Promise<number> {
    return this.nativeUpdate(where, data);
  }

  public async nativeDeletePublic(
    where: FilterQuery<TestEntity>,
  ): Promise<number> {
    return this.nativeDelete(where);
  }

  public getEntityManagerPublic(): EntityManager {
    return this.getEntityManager();
  }

  public getRepositoryPublic(): EntityRepository<TestEntity> {
    return this.getRepository();
  }
}

describe('BaseTenantRepository', () => {
  let repository: TestTenantRepository;
  let entityManager: jest.Mocked<EntityManager>;
  let entityRepository: jest.Mocked<EntityRepository<TestEntity>>;
  let tenantExecutor: jest.Mocked<TenantContextExecutor>;
  let logger: jest.Mocked<InstanceType<typeof Logger>>;
  const entityName = 'TestEntity' as EntityName<TestEntity>;

  beforeEach(() => {
    entityRepository = {
      findOne: jest.fn(),
      nativeUpdate: jest.fn(),
      nativeDelete: jest.fn(),
    } as unknown as jest.Mocked<EntityRepository<TestEntity>>;

    entityManager = {
      getRepository: jest.fn().mockReturnValue(entityRepository),
    } as unknown as jest.Mocked<EntityManager>;

    tenantExecutor = {
      getTenantIdOrFail: jest.fn().mockReturnValue('tenant-123'),
    } as unknown as jest.Mocked<TenantContextExecutor>;

    logger = {
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
    } as unknown as jest.Mocked<InstanceType<typeof Logger>>;

    repository = new TestTenantRepository(
      entityManager,
      entityName,
      tenantExecutor,
      logger,
    );
  });

  describe('findOne', () => {
    it('应自动注入租户过滤条件', async () => {
      const where = { name: 'test' };
      const options = { populate: ['relation'] };
      const expectedEntity = {
        id: '1',
        tenantId: 'tenant-123',
        name: 'test',
      };

      entityRepository.findOne.mockResolvedValue(expectedEntity as TestEntity);

      const result = await repository.findOnePublic(where, options);

      expect(result).toEqual(expectedEntity);
      expect(entityRepository.findOne).toHaveBeenCalledWith(
        { ...where, tenantId: 'tenant-123' },
        options,
      );
      expect(tenantExecutor.getTenantIdOrFail).toHaveBeenCalled();
    });

    it('当 where 条件为空时应只注入租户 ID', async () => {
      const expectedEntity = {
        id: '2',
        tenantId: 'tenant-123',
        name: 'test2',
      };

      entityRepository.findOne.mockResolvedValue(expectedEntity as TestEntity);

      const result = await repository.findOnePublic({});

      expect(result).toEqual(expectedEntity);
      expect(entityRepository.findOne).toHaveBeenCalledWith(
        { tenantId: 'tenant-123' },
        undefined,
      );
    });

    it('当 where 条件未定义时应只注入租户 ID', async () => {
      const expectedEntity = {
        id: '3',
        tenantId: 'tenant-123',
        name: 'test3',
      };

      entityRepository.findOne.mockResolvedValue(expectedEntity as TestEntity);

      const result = await repository.findOnePublic(undefined);

      expect(result).toEqual(expectedEntity);
      expect(entityRepository.findOne).toHaveBeenCalledWith(
        { tenantId: 'tenant-123' },
        undefined,
      );
    });

    it('当 where 条件中的 tenantId 与上下文一致时应正常执行', async () => {
      const where = { id: '1', tenantId: 'tenant-123' };
      const expectedEntity = {
        id: '1',
        tenantId: 'tenant-123',
        name: 'test',
      };

      entityRepository.findOne.mockResolvedValue(expectedEntity as TestEntity);

      const result = await repository.findOnePublic(where);

      expect(result).toEqual(expectedEntity);
      expect(entityRepository.findOne).toHaveBeenCalledWith(
        { ...where, tenantId: 'tenant-123' },
        undefined,
      );
    });

    it('当 where 条件中的 tenantId 与上下文不一致时应抛出异常', () => {
      const where = { id: '1', tenantId: 'tenant-other' };

      expect(() => repository.findOnePublic(where)).rejects.toThrow(
        GeneralForbiddenException,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '检测到跨租户访问，已阻止执行',
        undefined,
        {
          expectedTenantId: 'tenant-123',
          incomingTenantId: 'tenant-other',
        },
      );
    });

    it('当 where 条件中的 tenantId 为 null 时应正常执行', async () => {
      const where = { id: '1', tenantId: null };
      const expectedEntity = {
        id: '1',
        tenantId: 'tenant-123',
        name: 'test',
      };

      entityRepository.findOne.mockResolvedValue(expectedEntity as TestEntity);

      const result = await repository.findOnePublic(where);

      expect(result).toEqual(expectedEntity);
      expect(entityRepository.findOne).toHaveBeenCalledWith(
        { id: '1', tenantId: 'tenant-123' },
        undefined,
      );
    });

    it('应记录调试日志', async () => {
      const where = { name: 'test' };

      entityRepository.findOne.mockResolvedValue(null);

      await repository.findOnePublic(where);

      expect(logger.debug).toHaveBeenCalledWith('已自动注入租户过滤条件', {
        tenantId: 'tenant-123',
        repository: 'TestTenantRepository',
      });
    });
  });

  describe('nativeUpdate', () => {
    it('应自动注入租户过滤条件', async () => {
      const where = { name: 'old' };
      const data = { name: 'new' };

      entityRepository.nativeUpdate.mockResolvedValue(1);

      const result = await repository.nativeUpdatePublic(where, data);

      expect(result).toBe(1);
      expect(entityRepository.nativeUpdate).toHaveBeenCalledWith(
        { ...where, tenantId: 'tenant-123' },
        data,
      );
    });

    it('当检测到跨租户更新时应抛出异常', () => {
      const where = { id: '1', tenantId: 'tenant-other' };
      const data = { name: 'new' };

      expect(() => repository.nativeUpdatePublic(where, data)).rejects.toThrow(
        GeneralForbiddenException,
      );
    });
  });

  describe('nativeDelete', () => {
    it('应自动注入租户过滤条件', async () => {
      const where = { name: 'test' };

      entityRepository.nativeDelete.mockResolvedValue(1);

      const result = await repository.nativeDeletePublic(where);

      expect(result).toBe(1);
      expect(entityRepository.nativeDelete).toHaveBeenCalledWith({
        ...where,
        tenantId: 'tenant-123',
      });
    });

    it('当检测到跨租户删除时应抛出异常', () => {
      const where = { id: '1', tenantId: 'tenant-other' };

      expect(() => repository.nativeDeletePublic(where)).rejects.toThrow(
        GeneralForbiddenException,
      );
    });
  });

  describe('getEntityManager', () => {
    it('应返回 EntityManager 实例', () => {
      const em = repository.getEntityManagerPublic();

      expect(em).toBe(entityManager);
    });
  });

  describe('getRepository', () => {
    it('应返回 EntityRepository 实例', () => {
      const repo = repository.getRepositoryPublic();

      expect(repo).toBe(entityRepository);
    });
  });
});
