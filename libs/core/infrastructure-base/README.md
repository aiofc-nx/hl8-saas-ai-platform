# @hl8/infrastructure-base

> HL8 SAAS 平台基础设施基础模块 - 提供事件溯源、事件驱动、权限缓存、审计日志等核心基础设施能力

## 📋 模块概述

`@hl8/infrastructure-base` 是 HL8 SAAS 平台的基础设施层核心模块，为平台提供统一的基础设施服务，包括：

- **事件溯源（ES）域**：管理聚合事件存储、重放、并发控制与快照，支持永久保留和可选归档
- **事件驱动（EDA）域**：统一领域事件发布、外部消息队列桥接、Saga/投影订阅，支持分级降级
- **权限与缓存域**：提供 CASL 规则加载、缓存、多级失效与预热能力，支持缓存降级
- **审计与日志域**：持久化命令/查询审计信息，统一日志输出，支持永久保留和可选归档
- **配置与异常域**：提供配置加载、校验与异常封装，确保类型安全和统一错误处理

所有能力均支持多租户隔离，并提供测试替身支持单元测试。

## 🚀 快速开始

### 安装

```bash
pnpm add @hl8/infrastructure-base
```

### 基本使用

业务模块应该自己定义配置结构，使用 `@hl8/config` 加载配置，然后传递给基础设施模块：

```typescript
import { InfrastructureCoreModule } from '@hl8/infrastructure-base';
import { TypedConfigModule, directoryLoader, dotenvLoader } from '@hl8/config';
import { Module } from '@nestjs/common';
import { AppConfig } from './config/app.config.js';
import * as path from 'path';

@Module({
  imports: [
    // 业务模块自己加载配置
    TypedConfigModule.forRoot({
      schema: AppConfig, // 业务模块自己定义
      load: [
        directoryLoader({
          directory: path.join(process.cwd(), 'config'),
          include: /\.(json|yml|yaml)$/,
        }),
        dotenvLoader({
          separator: '__',
        }),
      ],
    }),
    // 传递配置给基础设施模块
    InfrastructureCoreModule.forRoot({
      isGlobal: true,
      eventStore: {
        isGlobal: false,
        contextName: 'eventstore',
        config: {
          connectionString: process.env.EVENT_STORE_CONNECTION_STRING,
          optimisticLockRetryCount: 3,
          optimisticLockRetryDelay: 100,
        },
      },
      eventPublisher: {
        isGlobal: false,
        config: {
          messageBrokerType: 'kafka',
          messageBrokerConnectionString: process.env.KAFKA_CONNECTION_STRING,
          enableMessageBrokerDegradation: true,
        },
      },
      abilityCache: {
        isGlobal: false,
        config: {
          cacheConnectionString: process.env.REDIS_CONNECTION_STRING,
          ttlSeconds: 3600,
          enableCacheDegradation: true,
        },
      },
      auditService: {
        isGlobal: false,
        contextName: 'audit',
        config: {
          connectionString: process.env.AUDIT_CONNECTION_STRING,
          enableArchiving: false,
        },
      },
      exceptionService: {
        isGlobal: false,
      },
    }),
  ],
})
export class AppModule {}
```

**注意**：基础设施模块只提供配置类型定义（如 `EventStoreConfig`、`EventPublisherConfig` 等），不定义完整的配置结构。业务模块应该：

1. 在自己的配置类中使用这些类型定义
2. 使用 `@hl8/config` 的 `TypedConfigModule` 加载配置
3. 将配置传递给基础设施模块

## 📚 核心功能

### 1. 事件存储（Event Store）

提供事件溯源能力，支持聚合事件的持久化存储、重放和快照管理。

```typescript
import { EventStore } from '@hl8/infrastructure-base';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  constructor(
    @Inject('EventStore')
    private readonly eventStore: EventStore,
  ) {}

  async createOrder(orderId: string, tenantId: string, payload: unknown) {
    // 追加事件
    await this.eventStore.append({
      eventId: randomUUID(),
      aggregateId: orderId,
      tenantId,
      version: 1,
      payload,
      occurredAt: new Date(),
      metadata: {},
    });
  }

  async loadOrder(orderId: string, tenantId: string) {
    // 加载事件流
    const events = await this.eventStore.load(aggregateId, tenantId);
    return events;
  }
}
```

### 2. 事件发布（Event Publisher）

提供统一的事件发布能力，支持内部事件总线和外部消息队列。

```typescript
import { EventPublisher } from '@hl8/infrastructure-base';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  constructor(
    @Inject('EventPublisher')
    private readonly eventPublisher: EventPublisher,
  ) {}

  async publishEvents(events: StoredEvent[]) {
    // 发布事件到内部事件总线和外部消息队列
    await this.eventPublisher.publish(events);
  }
}
```

### 3. 权限缓存（CASL Ability）

提供权限能力解析和缓存能力，支持多级缓存失效。

```typescript
import { CaslAbilityService, SecurityContext } from '@hl8/infrastructure-base';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  constructor(
    @Inject('CaslAbilityService')
    private readonly abilityService: CaslAbilityService,
  ) {}

  async checkPermission(userId: string, tenantId: string, action: string) {
    const context: SecurityContext = {
      userId,
      tenantId,
    };

    // 解析权限能力
    const ability = await this.abilityService.resolveAbility(context);

    // 检查权限
    return ability.can(action, 'Order');
  }
}
```

### 4. 审计服务（Audit Service）

提供审计记录能力，支持审计记录的持久化和查询。

```typescript
import { AuditService } from '@hl8/infrastructure-base';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  constructor(
    @Inject('AuditService')
    private readonly auditService: AuditService,
  ) {}

  async auditOperation(
    tenantId: string,
    userId: string,
    action: string,
    payload: unknown,
  ) {
    // 记录审计
    await this.auditService.append({
      auditId: randomUUID(),
      tenantId,
      userId,
      action,
      payload,
      occurredAt: new Date(),
      metadata: {},
    });
  }
}
```

### 5. 配置类型定义

基础设施模块提供配置类型定义（如 `EventStoreConfig`、`EventPublisherConfig` 等），供业务模块在自己的配置类中使用。

```typescript
import {
  EventStoreConfig,
  EventPublisherConfig,
} from '@hl8/infrastructure-base';
import { ValidateNested, Type } from 'class-validator';

// 业务模块定义自己的配置结构
export class AppConfig {
  @ValidateNested()
  @Type(() => EventStoreConfig)
  public readonly eventStore!: EventStoreConfig;

  @ValidateNested()
  @Type(() => EventPublisherConfig)
  public readonly eventPublisher!: EventPublisherConfig;
}
```

**注意**：`InfrastructureConfigModule` 和 `ConfigurationService` 已被移除。业务模块应该使用 `@hl8/config` 的 `TypedConfigModule` 来加载和管理配置。

### 6. 异常服务（Exception Service）

提供统一的异常处理能力，支持异常创建和记录。

```typescript
import { ExceptionService } from '@hl8/infrastructure-base';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  constructor(
    @Inject('ExceptionService')
    private readonly exceptionService: ExceptionService,
  ) {}

  async handleError(error: Error) {
    // 创建异常
    const exception = this.exceptionService.create(
      'ORDER_ERROR',
      '订单操作失败',
      { orderId: 'order-1' },
    );

    // 记录异常
    await this.exceptionService.log(exception);
  }
}
```

## 🔒 多租户隔离

所有服务接口都支持多租户隔离，确保跨租户数据访问的隔离性达到 100%。所有操作都必须显式传递 `tenantId` 参数，确保数据隔离。

```typescript
// ✅ 正确：显式传递 tenantId
await eventStore.append({
  aggregateId: 'aggregate-1',
  tenantId: 'tenant-1', // 必须显式传递
  version: 1,
  payload: {},
  occurredAt: new Date(),
});

// ❌ 错误：缺少 tenantId
await eventStore.append({
  aggregateId: 'aggregate-1',
  // tenantId 缺失，会抛出异常
  version: 1,
  payload: {},
  occurredAt: new Date(),
});
```

## 🧪 测试支持

所有服务都提供测试替身（Test Doubles），便于单元测试。

```typescript
import { InMemoryEventStore } from '@hl8/infrastructure-base';

// 在测试中使用内存事件存储
const eventStore = new InMemoryEventStore();

// 测试代码
await eventStore.append({
  eventId: 'event-1',
  aggregateId: 'aggregate-1',
  tenantId: 'tenant-1',
  version: 1,
  payload: {},
  occurredAt: new Date(),
});
```

## 📖 API 文档

### EventStore

**接口定义**：

```typescript
interface EventStore {
  append(event: StoredEvent): Promise<void>;
  load(aggregateId: string, tenantId: string): Promise<StoredEvent[]>;
  loadSince(
    aggregateId: string,
    tenantId: string,
    sinceVersion: number,
  ): Promise<StoredEvent[]>;
}
```

### EventPublisher

**接口定义**：

```typescript
interface EventPublisher {
  publish(events: StoredEvent[]): Promise<void>;
}
```

### CaslAbilityService

**接口定义**：

```typescript
interface CaslAbilityService {
  resolveAbility(context: SecurityContext): Promise<AppAbility>;
}
```

### AuditService

**接口定义**：

```typescript
interface AuditService {
  append(record: AuditRecord): Promise<void>;
  query(query: AuditQuery): Promise<AuditRecord[]>;
}
```

### ConfigurationService

**接口定义**：

```typescript
interface ConfigurationService {
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
}
```

### ExceptionService

**接口定义**：

```typescript
interface ExceptionService {
  create(
    errorCode: string,
    message: string,
    context?: Record<string, unknown>,
  ): ExceptionInfo;
  log(exception: ExceptionInfo): Promise<void>;
}
```

## 🔧 配置选项

### EventStoreConfig

```typescript
interface EventStoreConfig {
  connectionString: string;
  optimisticLockRetryCount?: number;
  optimisticLockRetryDelay?: number;
  enableArchiving?: boolean;
  archiveConnectionString?: string;
}
```

### EventPublisherConfig

```typescript
interface EventPublisherConfig {
  messageBrokerType: 'kafka' | 'rabbitmq' | 'rocketmq' | 'memory';
  messageBrokerConnectionString?: string;
  enableMessageBrokerDegradation?: boolean;
}
```

### AbilityCacheConfig

```typescript
interface AbilityCacheConfig {
  cacheConnectionString?: string;
  ttlSeconds?: number;
  enableCacheDegradation?: boolean;
}
```

### AuditServiceConfig

```typescript
interface AuditServiceConfig {
  connectionString: string;
  enableArchiving?: boolean;
  archiveConnectionString?: string;
}
```

## 🛡️ 错误处理

所有服务都使用统一的异常格式，所有错误信息使用中文。

```typescript
import {
  EventStoreException,
  EventStoreVersionConflictException,
  EventPublisherException,
  CaslAbilityException,
  AuditServiceException,
} from '@hl8/infrastructure-base';
```

## 📝 许可证

MIT

## 🔗 相关链接

- [设计文档](../../docs/designs/infrastructure-base-baseline.md)
- [详细设计](../../docs/designs/infrastructure-base-design.md)
- [功能规格](../../specs/001-infrastructure-base/spec.md)

## 👥 贡献

欢迎贡献！请查看 [贡献指南](../../CONTRIBUTING.md) 了解详细信息。

## 📄 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解所有变更记录。
