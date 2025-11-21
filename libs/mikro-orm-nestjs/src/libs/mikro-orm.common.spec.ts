/**
 * MikroORM 公共工具函数单元测试
 *
 * @description 测试 MikroORM 公共工具函数，包括注入令牌生成和装饰器创建
 */

import { describe, expect, it } from '@jest/globals';
import {
  getEntityManagerToken,
  getMikroORMToken,
  getRepositoryToken,
  InjectEntityManager,
  InjectMikroORM,
  InjectMikroORMs,
  InjectRepository,
} from './mikro-orm.common.js';

class TestEntity {
  id!: number;
}

describe('MikroORM Common Utils', () => {
  describe('getMikroORMToken', () => {
    it('应该根据上下文名称生成正确的令牌', () => {
      const token = getMikroORMToken('test-context');
      expect(token).toBe('test-context_MikroORM');
    });
  });

  describe('InjectMikroORM', () => {
    it('应该返回参数装饰器', () => {
      const decorator = InjectMikroORM('test-context');
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('InjectMikroORMs', () => {
    it('应该返回参数装饰器', () => {
      const decorator = InjectMikroORMs();
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('getEntityManagerToken', () => {
    it('应该根据上下文名称生成正确的令牌', () => {
      const token = getEntityManagerToken('test-context');
      expect(token).toBe('test-context_EntityManager');
    });
  });

  describe('InjectEntityManager', () => {
    it('应该返回参数装饰器', () => {
      const decorator = InjectEntityManager('test-context');
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('getRepositoryToken', () => {
    it('应该根据实体类生成正确的令牌', () => {
      const token = getRepositoryToken(TestEntity);
      expect(token).toBe('TestEntityRepository');
    });

    it('应该根据实体类和上下文名称生成正确的令牌', () => {
      const token = getRepositoryToken(TestEntity, 'test-context');
      expect(token).toBe('TestEntityRepository_test-context');
    });
  });

  describe('InjectRepository', () => {
    it('应该返回参数装饰器', () => {
      const decorator = InjectRepository(TestEntity);
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('应该支持上下文名称', () => {
      const decorator = InjectRepository(TestEntity, 'test-context');
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });
  });
});
