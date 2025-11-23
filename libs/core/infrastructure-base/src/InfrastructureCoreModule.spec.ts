/**
 * @fileoverview 基础设施核心模块单元测试
 * @description 测试基础设施核心模块的注册和配置功能
 */

import { InfrastructureCoreModule } from './InfrastructureCoreModule.js';

describe('InfrastructureCoreModule', () => {
  it('应该能够创建模块实例', () => {
    const module = InfrastructureCoreModule;
    expect(module).toBeDefined();
  });

  describe('forRoot', () => {
    it('应该能够使用默认选项注册模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot();

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(InfrastructureCoreModule);
      expect(dynamicModule.global).toBe(true);
      expect(dynamicModule.imports).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });

    it('应该能够使用自定义选项注册模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        isGlobal: false,
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(InfrastructureCoreModule);
      expect(dynamicModule.global).toBe(false);
    });

    it('应该能够注册事件存储模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        eventStore: {
          config: {
            connectionString: 'postgresql://localhost:5432/test',
            optimisticLockRetryCount: 3,
          },
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
      expect(Array.isArray(dynamicModule.imports)).toBe(true);
    });

    it('应该能够注册事件发布模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        eventPublisher: {
          config: {
            messageBrokerType: 'memory',
            enableMessageBrokerDegradation: true,
          },
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });

    it('应该能够注册权限缓存模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        abilityCache: {
          config: {
            ttlSeconds: 3600,
            enableCacheDegradation: true,
          },
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });

    it('应该能够注册审计服务模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        auditService: {
          config: {
            connectionString: 'postgresql://localhost:5432/test',
            enableArchiving: false,
          },
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });

    it('应该能够注册异常服务模块（默认启用）', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({});

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });

    it('应该能够禁用异常服务模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        exceptionService: false,
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });

    it('应该能够同时注册多个模块', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        eventStore: {
          config: {
            connectionString: 'postgresql://localhost:5432/test',
          },
        },
        eventPublisher: {
          config: {
            messageBrokerType: 'memory',
          },
        },
        abilityCache: {
          config: {
            ttlSeconds: 3600,
          },
        },
        auditService: {
          config: {
            connectionString: 'postgresql://localhost:5432/test',
          },
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
      expect(Array.isArray(dynamicModule.imports)).toBe(true);
    });

    it('应该能够配置模块的 isGlobal 选项', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        eventStore: {
          isGlobal: true,
          config: {
            connectionString: 'postgresql://localhost:5432/test',
          },
        },
        eventPublisher: {
          isGlobal: false,
          config: {
            messageBrokerType: 'memory',
          },
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });

    it('应该能够配置模块的 contextName 选项', () => {
      const dynamicModule = InfrastructureCoreModule.forRoot({
        eventStore: {
          contextName: 'eventstore',
          config: {
            connectionString: 'postgresql://localhost:5432/test',
          },
        },
        auditService: {
          contextName: 'audit',
          config: {
            connectionString: 'postgresql://localhost:5432/test',
          },
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });
  });
});
