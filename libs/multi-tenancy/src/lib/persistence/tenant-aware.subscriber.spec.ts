import { GeneralForbiddenException } from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { EventArgs } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core';
import { TenantContextExecutor } from '../tenant-context.executor.js';
import { TenantAwareSubscriber } from './tenant-aware.subscriber.js';

// 测试实体接口
interface TestEntity {
  tenantId?: string;
  name: string;
}

describe('TenantAwareSubscriber', () => {
  let subscriber: TenantAwareSubscriber;
  let entityManager: jest.Mocked<EntityManager>;
  let tenantExecutor: jest.Mocked<TenantContextExecutor>;
  let logger: jest.Mocked<InstanceType<typeof Logger>>;
  let eventManager: { registerSubscriber: jest.Mock };

  beforeEach(() => {
    eventManager = {
      registerSubscriber: jest.fn(),
    };

    entityManager = {
      getEventManager: jest.fn().mockReturnValue(eventManager),
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

    subscriber = new TenantAwareSubscriber(
      tenantExecutor,
      logger,
      entityManager,
    );
  });

  describe('构造函数', () => {
    it('应在构造时注册订阅器', () => {
      expect(eventManager.registerSubscriber).toHaveBeenCalledWith(subscriber);
    });
  });

  describe('getSubscribedEntities', () => {
    it('应返回空数组', () => {
      const entities = subscriber.getSubscribedEntities();

      expect(entities).toEqual([]);
    });
  });

  describe('beforeCreate', () => {
    it('当实体没有 tenantId 时应自动写入', async () => {
      const entity = { name: 'test' } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeCreate(args);

      expect(entity.tenantId).toBe('tenant-123');
      expect(logger.debug).toHaveBeenCalledWith('自动写入租户 ID', {
        entity: 'Object',
        tenantId: 'tenant-123',
      });
    });

    it('当实体已有正确的 tenantId 时应通过校验', async () => {
      const entity = {
        tenantId: 'tenant-123',
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeCreate(args);

      expect(entity.tenantId).toBe('tenant-123');
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('当实体 tenantId 与上下文不一致时应抛出异常', async () => {
      const entity = {
        tenantId: 'tenant-other',
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await expect(subscriber.beforeCreate(args)).rejects.toThrow(
        GeneralForbiddenException,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '实体租户 ID 与上下文不一致',
        undefined,
        {
          entity: 'Object',
          expectedTenantId: 'tenant-123',
          incomingTenantId: 'tenant-other',
        },
      );
    });

    it('当实体 tenantId 为 undefined 时应自动写入', async () => {
      const entity = {
        tenantId: undefined,
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeCreate(args);

      expect(entity.tenantId).toBe('tenant-123');
    });

    it('当实体 tenantId 为空字符串时应自动写入', async () => {
      const entity = {
        tenantId: '',
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeCreate(args);

      expect(entity.tenantId).toBe('tenant-123');
    });
  });

  describe('beforeUpdate', () => {
    it('当实体没有 tenantId 时应通过校验', async () => {
      const entity = { name: 'test' } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeUpdate(args);

      expect(tenantExecutor.getTenantIdOrFail).toHaveBeenCalled();
    });

    it('当实体 tenantId 与上下文一致时应通过校验', async () => {
      const entity = {
        tenantId: 'tenant-123',
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeUpdate(args);

      expect(logger.error).not.toHaveBeenCalled();
    });

    it('当实体 tenantId 与上下文不一致时应抛出异常', async () => {
      const entity = {
        tenantId: 'tenant-other',
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await expect(subscriber.beforeUpdate(args)).rejects.toThrow(
        GeneralForbiddenException,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '检测到跨租户更新尝试',
        undefined,
        {
          entity: 'Object',
          expectedTenantId: 'tenant-123',
          incomingTenantId: 'tenant-other',
        },
      );
    });

    it('当实体 tenantId 为 undefined 时应通过校验', async () => {
      const entity = {
        tenantId: undefined,
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeUpdate(args);

      expect(logger.error).not.toHaveBeenCalled();
    });

    it('当实体 tenantId 为 null 时应通过校验', async () => {
      const entity = {
        tenantId: null as any,
        name: 'test',
      } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await subscriber.beforeUpdate(args);

      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('当 getTenantIdOrFail 抛出异常时应传播异常', async () => {
      const error = new Error('缺少租户上下文');
      tenantExecutor.getTenantIdOrFail.mockImplementation(() => {
        throw error;
      });

      const entity = { name: 'test' } as TestEntity;
      const args = {
        entity,
        em: entityManager,
      } as EventArgs<TestEntity>;

      await expect(subscriber.beforeCreate(args)).rejects.toThrow(
        '缺少租户上下文',
      );
    });
  });
});
