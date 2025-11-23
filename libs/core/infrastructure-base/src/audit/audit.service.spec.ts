/**
 * @fileoverview 审计服务单元测试
 * @description 测试审计服务的核心功能，包括审计记录追加、查询和敏感字段脱敏
 */

import { Logger } from '@hl8/logger';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { randomUUID } from 'crypto';
import { AuditServiceException } from '../exceptions/infrastructure-exception.js';
import type { AuditQuery, AuditRecord } from './audit.interface.js';
import { AuditServiceImpl } from './audit.service.js';
import type { IAuditRepository } from './repositories/audit.repository.js';

class MockAuditRepository implements IAuditRepository {
  public records: AuditRecord[] = [];

  public async insert(record: AuditRecord): Promise<void> {
    this.records.push(record);
  }

  public async insertBatch(records: AuditRecord[]): Promise<void> {
    this.records.push(...records);
  }

  public async query(query: AuditQuery): Promise<AuditRecord[]> {
    return this.records.filter((record) => {
      if (record.tenantId !== query.tenantId) {
        return false;
      }
      if (query.userId && record.userId !== query.userId) {
        return false;
      }
      if (query.action && record.action !== query.action) {
        return false;
      }
      if (query.startTime) {
        // 比较日期部分，忽略时间部分（使用 UTC）
        const startDate = new Date(query.startTime);
        startDate.setUTCHours(0, 0, 0, 0);
        const recordDate = new Date(record.occurredAt);
        recordDate.setUTCHours(0, 0, 0, 0);
        if (recordDate.getTime() < startDate.getTime()) {
          return false;
        }
      }
      if (query.endTime) {
        // 比较日期部分，包含结束日期的整天（使用 UTC）
        const endDate = new Date(query.endTime);
        endDate.setUTCHours(23, 59, 59, 999);
        const recordDate = new Date(record.occurredAt);
        if (recordDate.getTime() > endDate.getTime()) {
          return false;
        }
      }
      return true;
    });
  }
}

describe('AuditServiceImpl', () => {
  let auditService: AuditServiceImpl;
  let repository: MockAuditRepository;
  let logger: jest.Mocked<Logger>;
  let timers: NodeJS.Timeout[] = [];

  beforeEach(() => {
    repository = new MockAuditRepository();
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    // 使用 jest.useFakeTimers 来管理定时器
    jest.useFakeTimers();
    auditService = new AuditServiceImpl(
      repository as unknown as IAuditRepository,
      logger,
    );
  });

  afterEach(() => {
    // 清理所有定时器
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('append', () => {
    it('应该能够追加审计记录', async () => {
      // 准备
      const record: AuditRecord = {
        auditId: randomUUID(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        payload: { resource: 'Order', id: 'order-1' },
        occurredAt: new Date(),
        metadata: { requestId: 'req-1' },
      };

      // 执行
      await auditService.append(record);

      // 验证
      expect(repository.records).toHaveLength(1);
      expect(repository.records[0]?.auditId).toBe(record.auditId);
      expect(repository.records[0]?.tenantId).toBe(record.tenantId);
      expect(repository.records[0]?.userId).toBe(record.userId);
      expect(repository.records[0]?.action).toBe(record.action);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('应该能够脱敏敏感字段', async () => {
      // 准备
      const record: AuditRecord = {
        auditId: randomUUID(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        payload: {
          resource: 'User',
          id: 'user-1',
          password: 'secret123',
          token: 'token123',
        },
        occurredAt: new Date(),
        metadata: {
          api_key: 'key123',
        },
      };

      // 执行
      await auditService.append(record);

      // 验证
      expect(repository.records).toHaveLength(1);
      const storedRecord = repository.records[0];
      expect(storedRecord).toBeDefined();
      if (storedRecord) {
        const payload = storedRecord.payload as Record<string, unknown>;
        expect(payload.password).toBe('***');
        expect(payload.token).toBe('***');
        const metadata = storedRecord.metadata as Record<string, unknown>;
        expect(metadata.api_key).toBe('***');
      }
    });

    it('应该能够处理嵌套对象的敏感字段脱敏', async () => {
      // 准备
      const record: AuditRecord = {
        auditId: randomUUID(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        payload: {
          resource: 'User',
          nested: {
            password: 'secret123',
            data: {
              token: 'token123',
            },
          },
        },
        occurredAt: new Date(),
      };

      // 执行
      await auditService.append(record);

      // 验证
      expect(repository.records).toHaveLength(1);
      const storedRecord = repository.records[0];
      expect(storedRecord).toBeDefined();
      if (storedRecord) {
        const payload = storedRecord.payload as Record<string, unknown>;
        const nested = payload.nested as Record<string, unknown>;
        expect(nested.password).toBe('***');
        const data = nested.data as Record<string, unknown>;
        expect(data.token).toBe('***');
      }
    });

    it('应该能够处理数组中的敏感字段脱敏', async () => {
      // 准备
      const record: AuditRecord = {
        auditId: randomUUID(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        payload: {
          users: [
            { id: 'user-1', password: 'secret1' },
            { id: 'user-2', password: 'secret2' },
          ],
        },
        occurredAt: new Date(),
      };

      // 执行
      await auditService.append(record);

      // 验证
      expect(repository.records).toHaveLength(1);
      const storedRecord = repository.records[0];
      expect(storedRecord).toBeDefined();
      if (storedRecord) {
        const payload = storedRecord.payload as Record<string, unknown>;
        const users = payload.users as Array<Record<string, unknown>>;
        expect(users[0]?.password).toBe('***');
        expect(users[1]?.password).toBe('***');
      }
    });

    it('应该能够在写入失败时将记录加入重试队列', async () => {
      // 准备
      const failingRepository: IAuditRepository = {
        insert: jest
          .fn<IAuditRepository['insert']>()
          .mockRejectedValue(new Error('写入失败')),
        query: jest.fn<IAuditRepository['query']>().mockResolvedValue([]),
        insertBatch: jest
          .fn<IAuditRepository['insertBatch']>()
          .mockResolvedValue(undefined),
      };

      const service = new AuditServiceImpl(failingRepository, logger);

      const record: AuditRecord = {
        auditId: randomUUID(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        payload: { resource: 'Order' },
        occurredAt: new Date(),
      };

      // 执行
      await service.append(record);

      // 验证
      expect(failingRepository.insert).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('应该在重试队列过大时抛出异常', async () => {
      // 准备
      const failingRepository: IAuditRepository = {
        insert: jest
          .fn<IAuditRepository['insert']>()
          .mockRejectedValue(new Error('写入失败')),
        query: jest.fn<IAuditRepository['query']>().mockResolvedValue([]),
        insertBatch: jest
          .fn<IAuditRepository['insertBatch']>()
          .mockResolvedValue(undefined),
      };

      const service = new AuditServiceImpl(failingRepository, logger);

      // 填充重试队列到1000条（刚好不超过限制）
      for (let i = 0; i < 1000; i++) {
        const record: AuditRecord = {
          auditId: randomUUID(),
          tenantId: 'tenant-1',
          userId: 'user-1',
          action: 'CREATE',
          payload: { resource: 'Order' },
          occurredAt: new Date(),
        };
        await service.append(record);
      }

      // 执行并验证：第1001条应该抛出异常
      const record: AuditRecord = {
        auditId: randomUUID(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        payload: { resource: 'Order' },
        occurredAt: new Date(),
      };

      await expect(service.append(record)).rejects.toThrow(
        AuditServiceException,
      );
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      // 准备测试数据
      const records: AuditRecord[] = [
        {
          auditId: randomUUID(),
          tenantId: 'tenant-1',
          userId: 'user-1',
          action: 'CREATE',
          payload: { resource: 'Order', id: 'order-1' },
          occurredAt: new Date('2024-01-01'),
          metadata: {},
        },
        {
          auditId: randomUUID(),
          tenantId: 'tenant-1',
          userId: 'user-1',
          action: 'UPDATE',
          payload: { resource: 'Order', id: 'order-1' },
          occurredAt: new Date('2024-01-02'),
          metadata: {},
        },
        {
          auditId: randomUUID(),
          tenantId: 'tenant-1',
          userId: 'user-2',
          action: 'CREATE',
          payload: { resource: 'Order', id: 'order-2' },
          occurredAt: new Date('2024-01-03'),
          metadata: {},
        },
        {
          auditId: randomUUID(),
          tenantId: 'tenant-2',
          userId: 'user-1',
          action: 'CREATE',
          payload: { resource: 'Order', id: 'order-3' },
          occurredAt: new Date('2024-01-04'),
          metadata: {},
        },
      ];

      for (const record of records) {
        await auditService.append(record);
      }
    });

    it('应该能够按租户查询审计记录', async () => {
      // 准备
      const query: AuditQuery = {
        tenantId: 'tenant-1',
        limit: 100,
        offset: 0,
      };

      // 执行
      const result = await auditService.query(query);

      // 验证
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.tenantId === 'tenant-1')).toBe(true);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('应该能够按用户查询审计记录', async () => {
      // 准备
      const query: AuditQuery = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        limit: 100,
        offset: 0,
      };

      // 执行
      const result = await auditService.query(query);

      // 验证
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.userId === 'user-1')).toBe(true);
    });

    it('应该能够按操作类型查询审计记录', async () => {
      // 准备
      const query: AuditQuery = {
        tenantId: 'tenant-1',
        action: 'CREATE',
        limit: 100,
        offset: 0,
      };

      // 执行
      const result = await auditService.query(query);

      // 验证
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.action === 'CREATE')).toBe(true);
    });

    it('应该能够按时间范围查询审计记录', async () => {
      // 准备：查询 2024-01-02 到 2024-01-03 之间的记录
      // 应该包含：2024-01-02 的 UPDATE 和 2024-01-03 的 CREATE（user-2）
      // 不应该包含：2024-01-01 的 CREATE
      const startTime = new Date('2024-01-02T00:00:00.000Z');
      const endTime = new Date('2024-01-03T23:59:59.999Z');

      const query: AuditQuery = {
        tenantId: 'tenant-1',
        startTime,
        endTime,
        limit: 100,
        offset: 0,
      };

      // 执行
      const result = await auditService.query(query);

      // 验证：应该返回2条记录（UPDATE 和 user-2 的 CREATE）
      expect(result).toHaveLength(2);
      expect(result.some((r) => r.action === 'UPDATE')).toBe(true);
      expect(result.some((r) => r.userId === 'user-2')).toBe(true);
      // 验证不包含 2024-01-01 的记录
      const jan1 = new Date('2024-01-01T00:00:00.000Z');
      expect(
        result.every((r) => {
          const rDate = new Date(r.occurredAt);
          return rDate >= startTime;
        }),
      ).toBe(true);
      expect(
        result.every((r) => {
          const rDate = new Date(r.occurredAt);
          return rDate <= endTime;
        }),
      ).toBe(true);
    });

    it('应该在查询失败时抛出异常', async () => {
      // 准备
      const failingRepository: IAuditRepository = {
        insert: jest
          .fn<IAuditRepository['insert']>()
          .mockResolvedValue(undefined),
        query: jest
          .fn<IAuditRepository['query']>()
          .mockRejectedValue(new Error('查询失败')),
        insertBatch: jest
          .fn<IAuditRepository['insertBatch']>()
          .mockResolvedValue(undefined),
      };

      const service = new AuditServiceImpl(failingRepository, logger);

      const query: AuditQuery = {
        tenantId: 'tenant-1',
        limit: 100,
        offset: 0,
      };

      // 执行并验证
      await expect(service.query(query)).rejects.toThrow(AuditServiceException);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
