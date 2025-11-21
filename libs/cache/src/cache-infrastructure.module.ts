import { Module } from '@nestjs/common';
import { CacheNamespaceRegistry } from './config/cache-namespace.registry.js';
import { CacheConfig } from './config/cache.config.js';
import { TenantConfigKeyBuilder } from './keys/tenant-config-key.builder.js';
import { CacheMetricsHook } from './monitoring/cache-metrics.hook.js';
import { CacheClientProvider } from './services/cache-client.provider.js';
import { CacheConsistencyService } from './services/cache-consistency.service.js';
import { CacheNamespaceService } from './services/cache-namespace.service.js';
import { CacheNotificationService } from './services/cache-notification.service.js';
import { CacheReadService } from './services/cache-read.service.js';

/**
 * @description 缓存基础设施模块，聚合 Redis 客户端与分布式锁能力，同时暴露缓存一致性相关服务。
 *
 * **重要说明**：
 * - 此模块提供默认的 `CacheConfig` 实例（如果外部未提供）
 * - 外部模块可以通过提供 `CacheConfig` 来覆盖默认配置
 * - 默认配置使用内存降级模式，适合开发和测试环境
 */
@Module({
  imports: [],
  providers: [
    // 提供默认的 CacheConfig 实例（如果外部未提供）
    // 外部模块可以通过提供 CacheConfig 来覆盖此提供者
    {
      provide: CacheConfig,
      useFactory: () => {
        const config = new CacheConfig();
        // 设置默认值，使用内存降级模式
        config.useMemoryFallback = true;
        config.readyLog = true;
        config.errorLog = true;
        // 如果没有配置客户端，使用空数组（将触发内存降级）
        config.clients = [];
        config.namespacePolicies = [];
        return config;
      },
    },
    CacheClientProvider,
    CacheMetricsHook,
    CacheReadService,
    TenantConfigKeyBuilder,
    CacheNamespaceRegistry,
    CacheNamespaceService,
    CacheConsistencyService,
    CacheNotificationService,
  ],
  exports: [
    CacheConfig,
    CacheClientProvider,
    CacheMetricsHook,
    CacheReadService,
    TenantConfigKeyBuilder,
    CacheNamespaceRegistry,
    CacheNamespaceService,
    CacheConsistencyService,
    CacheNotificationService,
  ],
})
export class CacheInfrastructureModule {}
