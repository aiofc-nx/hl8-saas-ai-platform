# @hl8/audit 审计模块培训教程

## 📋 文档概述

本文档是 `@hl8/audit` 审计模块的完整培训教程，涵盖模块介绍、使用场景、快速上手、最佳实践和实际应用示例。适用于需要为应用添加审计功能的开发人员。

**目标读者**：

- 应用层开发人员
- 基础设施层开发人员
- 系统架构师

**前置知识**：

- NestJS 基础
- CQRS 模式
- TypeScript
- 多租户架构基础

---

## 📚 目录

1. [模块概述](#模块概述)
2. [核心功能](#核心功能)
3. [适用场景](#适用场景)
4. [快速上手](#快速上手)
5. [API 文档](#api-文档)
6. [实际应用示例](#实际应用示例)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)
9. [进阶使用](#进阶使用)

---

## 模块概述

### 什么是 @hl8/audit？

`@hl8/audit` 是一个独立的审计功能模块，提供命令和查询的自动审计记录能力。它通过拦截器机制自动记录所有命令和查询的执行轨迹，无需在业务代码中手动调用审计。

### 设计理念

- **零侵入**：通过拦截器自动记录，业务代码无需修改
- **统一格式**：标准化的审计记录结构，便于查询和分析
- **多租户支持**：自动包含租户和用户信息
- **可扩展**：支持自定义审计服务实现
- **类型安全**：完整的 TypeScript 类型支持

### 架构位置

```
┌─────────────────────────────────────┐
│      Interface Layer (API)          │
│  (Controllers, DTOs, Validators)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Application Layer (CQRS)         │
│  ┌──────────────────────────────┐   │
│  │  @hl8/audit                  │   │
│  │  - AuditCommandInterceptor   │   │
│  │  - AuditQueryInterceptor     │   │
│  │  - AuditCoordinator          │   │
│  └──────────────────────────────┘   │
│  Commands / Queries / Handlers       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Infrastructure Layer              │
│  - AuditService Implementation      │
│  - Database / Message Queue         │
└─────────────────────────────────────┘
```

---

## 核心功能

### 1. AuditCoordinator（审计协调器）

统一聚合审计记录并调用底层审计服务。

**职责**：

- 合并执行上下文与审计数据
- 调用审计服务进行持久化
- 处理审计服务异常

**特点**：

- 自动合并 `ExecutionContext` 中的租户和用户信息
- 支持同步和异步审计服务（Promise 或 Observable）
- 统一的错误处理

### 2. AuditCommandInterceptor（命令审计拦截器）

自动记录命令执行的拦截器。

**职责**：

- 拦截所有命令执行
- 提取命令的 `auditPayload()` 数据
- 调用 `AuditCoordinator` 记录审计信息

**适用场景**：

- 写操作（创建、更新、删除）
- 业务流程操作（下单、支付、审批等）
- 敏感操作（权限变更、数据删除等）

### 3. AuditQueryInterceptor（查询审计拦截器）

自动记录查询执行的拦截器。

**职责**：

- 拦截所有查询执行
- 提取查询的 `auditPayload()` 数据
- 调用 `AuditCoordinator` 记录审计信息

**适用场景**：

- 读操作（查询列表、详情等）
- 报表查询
- 数据导出

### 4. AuditApplicationModule（审计应用层模块）

集中注册审计相关组件的 NestJS 模块。

**功能**：

- 统一注册所有审计相关组件
- 支持可选启用/禁用审计功能
- 支持自定义审计服务实现

---

## 适用场景

### 1. 合规与审计要求

**场景描述**：
金融、医疗、政府等行业需要完整的操作记录，以满足法规要求。

**示例**：

- 金融交易记录（满足 SOX 合规）
- 医疗数据访问记录（满足 HIPAA 合规）
- 政府数据操作记录（满足数据保护法规）

**实现要点**：

- 记录所有关键操作
- 确保审计记录不可篡改
- 支持长期存储和查询

### 2. 安全审计

**场景描述**：
记录安全相关操作，用于安全事件调查和异常行为检测。

**示例**：

- 用户登录/登出记录
- 权限变更记录
- 敏感数据访问记录
- 异常操作检测

**实现要点**：

- 记录操作者身份
- 记录操作时间和 IP 地址
- 记录操作结果（成功/失败）

### 3. 业务分析

**场景描述**：
通过审计记录分析用户行为和业务流程，优化产品和服务。

**示例**：

- 用户行为分析（哪些功能使用频率高）
- 操作路径分析（用户如何完成某个任务）
- 业务流程优化（识别瓶颈环节）

**实现要点**：

- 记录关键业务数据
- 支持数据分析和报表生成
- 保护用户隐私（脱敏处理）

### 4. 问题排查

**场景描述**：
当系统出现问题时，通过审计记录快速定位问题原因。

**示例**：

- 数据异常排查（谁在什么时候修改了数据）
- 操作失败分析（为什么操作失败）
- 性能问题分析（哪些操作耗时较长）

**实现要点**：

- 记录完整的操作上下文
- 记录操作结果和错误信息
- 支持按时间、用户、操作类型查询

### 5. 责任追溯

**场景描述**：
当出现问题时，能够追溯到具体的操作者和操作时间。

**示例**：

- 数据误删恢复（谁删除了数据，什么时候删除的）
- 配置变更追溯（谁修改了配置，修改了什么）
- 异常操作调查（谁执行了异常操作）

**实现要点**：

- 记录操作者身份
- 记录操作时间戳
- 记录操作前后的数据快照

---

## 快速上手

### 步骤 1：安装依赖

```bash
pnpm add @hl8/audit
```

### 步骤 2：实现审计服务

审计服务负责将审计记录持久化到数据库或其他存储系统。

```typescript
import { Injectable } from '@nestjs/common';
import { AuditService, AuditRecord } from '@hl8/audit';
import type { ExecutionContext } from '@hl8/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { AuditLog } from './entities/audit-log.entity';

/**
 * IAM 审计服务实现
 *
 * @description 负责将审计记录持久化到 PostgreSQL 数据库
 */
@Injectable()
export class IamAuditService implements AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: EntityRepository<AuditLog>,
  ) {}

  /**
   * 追加审计记录
   *
   * @param context - 执行上下文
   * @param record - 审计记录
   */
  async append<TResult>(
    context: ExecutionContext,
    record: AuditRecord<TResult>,
  ): Promise<void> {
    // 创建审计日志实体
    const auditLog = this.auditRepository.create({
      tenantId: record.tenantId,
      userId: record.userId,
      action: record.action,
      payload: record.payload,
      result: record.result,
      metadata: {
        ...record.metadata,
        // 从执行上下文提取额外信息
        ipAddress: context.metadata?.ipAddress,
        userAgent: context.metadata?.userAgent,
        traceId: context.metadata?.traceId,
      },
      createdAt: new Date(),
    });

    // 持久化到数据库
    await this.auditRepository.persistAndFlush(auditLog);
  }
}
```

**审计日志实体示例**：

```typescript
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'audit_logs' })
export class AuditLog {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 255 })
  userId!: string;

  @Property({ type: 'varchar', length: 255 })
  action!: string;

  @Property({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Property({ type: 'jsonb', nullable: true })
  result?: unknown;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
```

### 步骤 3：注册审计模块

在应用模块中注册 `AuditApplicationModule`：

```typescript
import { Module } from '@nestjs/common';
import { AuditApplicationModule, AUDIT_SERVICE_TOKEN } from '@hl8/audit';
import { IamAuditService } from './audit/iam-audit.service';

@Module({
  imports: [
    AuditApplicationModule.register({
      auditService: {
        provide: AUDIT_SERVICE_TOKEN,
        useClass: IamAuditService,
      },
    }),
  ],
})
export class AppModule {}
```

### 步骤 4：在命令/查询中提供审计数据

在命令或查询中重写 `auditPayload()` 方法，提供需要审计的数据：

```typescript
import { CommandBase } from '@hl8/application-base';
import type { ExecutionContext } from '@hl8/common';

/**
 * 创建用户命令
 */
export class CreateUserCommand extends CommandBase<UserResult> {
  constructor(
    context: ExecutionContext,
    public readonly userData: {
      username: string;
      email: string;
      role: string;
    },
  ) {
    super(context);
  }

  /**
   * 返回审计所需的载荷
   *
   * @remarks 不包含敏感信息（如密码）
   */
  public auditPayload(): Record<string, unknown> {
    return {
      username: this.userData.username,
      email: this.userData.email,
      role: this.userData.role,
    };
  }
}
```

### 步骤 5：验证审计功能

执行命令后，检查数据库中的审计记录：

```sql
SELECT * FROM audit_logs
WHERE action = 'CreateUserCommand'
ORDER BY created_at DESC
LIMIT 10;
```

---

## API 文档

### AuditCoordinator

审计协调器，统一聚合审计记录并调用底层审计服务。

```typescript
class AuditCoordinator {
  /**
   * 记录审计信息
   *
   * @param context - 执行上下文
   * @param record - 审计记录
   * @throws {MissingConfigurationForFeatureException} 当审计服务未配置时
   * @throws {AuditRecordException} 当审计服务执行失败时
   */
  record<TResult>(
    context: ExecutionContext,
    record: AuditRecord<TResult>,
  ): Promise<void>;
}
```

**使用示例**：

```typescript
const coordinator = new AuditCoordinator(auditService);

await coordinator.record(context, {
  tenantId: 'tenant-1',
  userId: 'user-1',
  action: 'CustomAction',
  payload: { key: 'value' },
  result: { success: true },
  metadata: { channel: 'custom' },
});
```

### AuditCommandInterceptor

命令执行审计拦截器，适用于基于控制器触发的命令请求。

**自动功能**：

- 拦截所有命令执行
- 从命令中提取 `auditPayload()`
- 从请求中提取 `executionContext`
- 调用 `AuditCoordinator` 记录审计信息

**无需手动调用**：拦截器会自动工作，无需在业务代码中手动调用。

### AuditQueryInterceptor

查询执行审计拦截器，适用于读操作的 API。

**自动功能**：

- 拦截所有查询执行
- 从查询中提取 `auditPayload()`
- 从请求中提取 `executionContext`
- 调用 `AuditCoordinator` 记录审计信息

**无需手动调用**：拦截器会自动工作，无需在业务代码中手动调用。

### AuditService

审计服务接口，由基础设施层实现。

```typescript
interface AuditService {
  /**
   * 追加一条审计记录
   *
   * @param context - 当前执行上下文
   * @param record - 审计记录内容
   * @returns Promise 或 Observable，支持同步和异步处理
   */
  append<TResult = unknown>(
    context: ExecutionContext,
    record: AuditRecord<TResult>,
  ): Promise<void> | Observable<void>;
}
```

**实现要求**：

- 必须实现 `append` 方法
- 可以返回 `Promise<void>` 或 `Observable<void>`
- 应该处理持久化逻辑（数据库、消息队列等）

### AuditRecord

审计记录结构，描述命令或查询的执行信息。

```typescript
interface AuditRecord<TResult = unknown> {
  /**
   * 租户标识
   */
  readonly tenantId: string;

  /**
   * 执行人用户标识
   */
  readonly userId: string;

  /**
   * 记录的动作名称，通常为命令或查询名称
   */
  readonly action: string;

  /**
   * 输入载荷或上下文信息
   */
  readonly payload?: Record<string, unknown>;

  /**
   * 执行结果快照，可用于追踪
   */
  readonly result?: TResult;

  /**
   * 额外元数据，如请求 ID、客户端信息等
   */
  readonly metadata?: Record<string, unknown>;
}
```

### AuditApplicationModule

审计应用层模块，集中注册审计相关组件。

```typescript
interface AuditApplicationModuleOptions {
  /**
   * 审计服务提供者（必须 provide 为 `AUDIT_SERVICE_TOKEN`）
   *
   * @remarks 如果提供了此选项且 `enableAudit` 不为 false，则注册审计相关组件
   */
  readonly auditService?: Provider;

  /**
   * 是否启用审计相关组件
   *
   * @remarks 默认值：如果提供了 `auditService` 则为 true，否则为 false。
   * 如果为 false，则不注册 `AuditCoordinator`、`AuditCommandInterceptor`、`AuditQueryInterceptor`。
   */
  readonly enableAudit?: boolean;

  /**
   * 额外需要注册的提供者
   */
  readonly extraProviders?: Provider[];
}
```

**使用示例**：

```typescript
// 启用审计
AuditApplicationModule.register({
  auditService: {
    provide: AUDIT_SERVICE_TOKEN,
    useClass: IamAuditService,
  },
});

// 禁用审计（用于测试环境）
AuditApplicationModule.register({
  enableAudit: false,
});
```

---

## 实际应用示例

### 示例 1：用户管理审计

**场景**：记录用户创建、更新、删除操作。

```typescript
// 命令：创建用户
export class CreateUserCommand extends CommandBase<UserResult> {
  constructor(
    context: ExecutionContext,
    public readonly userData: CreateUserDto,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      action: 'CREATE_USER',
      username: this.userData.username,
      email: this.userData.email,
      role: this.userData.role,
      // 不包含密码等敏感信息
    };
  }
}

// 命令：更新用户
export class UpdateUserCommand extends CommandBase<UserResult> {
  constructor(
    context: ExecutionContext,
    public readonly userId: string,
    public readonly updates: UpdateUserDto,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      action: 'UPDATE_USER',
      userId: this.userId,
      updates: this.updates,
      // 记录变更内容，便于追溯
    };
  }
}

// 命令：删除用户
export class DeleteUserCommand extends CommandBase<void> {
  constructor(
    context: ExecutionContext,
    public readonly userId: string,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      action: 'DELETE_USER',
      deletedUserId: this.userId,
      // 记录被删除的用户ID，便于恢复和追溯
    };
  }
}
```

**审计记录示例**：

```json
{
  "tenantId": "tenant-1",
  "userId": "admin-123",
  "action": "CreateUserCommand",
  "payload": {
    "action": "CREATE_USER",
    "username": "john",
    "email": "john@example.com",
    "role": "user"
  },
  "result": {
    "id": "user-456",
    "username": "john",
    "email": "john@example.com"
  },
  "metadata": {
    "channel": "command",
    "traceId": "trace-789",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 示例 2：订单管理审计

**场景**：记录订单创建、支付、取消等操作。

```typescript
// 命令：创建订单
export class CreateOrderCommand extends CommandBase<OrderResult> {
  constructor(
    context: ExecutionContext,
    public readonly orderData: CreateOrderDto,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      orderId: this.orderData.orderId,
      amount: this.orderData.amount,
      items: this.orderData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }
}

// 命令：支付订单
export class PayOrderCommand extends CommandBase<PaymentResult> {
  constructor(
    context: ExecutionContext,
    public readonly orderId: string,
    public readonly paymentMethod: string,
    public readonly amount: number,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      orderId: this.orderId,
      paymentMethod: this.paymentMethod,
      amount: this.amount,
      // 不包含支付密码、CVV 等敏感信息
    };
  }
}
```

### 示例 3：权限管理审计

**场景**：记录权限变更操作，这是敏感操作，需要详细审计。

```typescript
// 命令：分配角色
export class AssignRoleCommand extends CommandBase<void> {
  constructor(
    context: ExecutionContext,
    public readonly userId: string,
    public readonly roleId: string,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      action: 'ASSIGN_ROLE',
      targetUserId: this.userId,
      roleId: this.roleId,
      // 权限变更是敏感操作，需要详细记录
    };
  }
}

// 命令：撤销权限
export class RevokePermissionCommand extends CommandBase<void> {
  constructor(
    context: ExecutionContext,
    public readonly userId: string,
    public readonly permissionId: string,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      action: 'REVOKE_PERMISSION',
      targetUserId: this.userId,
      permissionId: this.permissionId,
    };
  }
}
```

### 示例 4：查询审计

**场景**：记录敏感查询操作，如用户信息查询、报表查询等。

```typescript
// 查询：获取用户列表
export class GetUsersQuery extends QueryBase<User[]> {
  constructor(
    context: ExecutionContext,
    public readonly filters: UserFilters,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      filters: this.filters,
      // 记录查询条件，便于分析用户查询行为
    };
  }
}

// 查询：导出用户数据
export class ExportUsersQuery extends QueryBase<Blob> {
  constructor(
    context: ExecutionContext,
    public readonly filters: UserFilters,
  ) {
    super(context);
  }

  public auditPayload() {
    return {
      action: 'EXPORT_USERS',
      filters: this.filters,
      // 数据导出是敏感操作，需要详细记录
    };
  }
}
```

---

## 最佳实践

### 1. 审计数据设计

#### ✅ 好的实践

```typescript
// 记录关键业务数据
public auditPayload() {
  return {
    orderId: this.orderId,
    amount: this.amount,
    status: this.status,
    customerId: this.customerId,
  };
}

// 记录操作类型和上下文
public auditPayload() {
  return {
    action: 'UPDATE_ORDER_STATUS',
    orderId: this.orderId,
    oldStatus: this.oldStatus,
    newStatus: this.newStatus,
  };
}
```

#### ❌ 避免的做法

```typescript
// ❌ 不要记录敏感信息
public auditPayload() {
  return {
    password: this.password,           // ❌ 密码
    creditCard: this.creditCard,      // ❌ 信用卡号
    cvv: this.cvv,                    // ❌ CVV
    ssn: this.ssn,                    // ❌ 社会安全号
  };
}

// ❌ 不要记录过大的数据
public auditPayload() {
  return {
    largeFile: this.largeFile,        // ❌ 大文件内容
    imageData: this.imageData,        // ❌ 图片二进制数据
  };
}

// ❌ 不要记录临时数据
public auditPayload() {
  return {
    tempToken: this.tempToken,        // ❌ 临时令牌
    sessionId: this.sessionId,         // ❌ 会话ID（除非必要）
  };
}
```

### 2. 性能优化

#### 异步审计服务

使用消息队列异步处理审计记录，避免阻塞主流程：

```typescript
@Injectable()
export class AsyncAuditService implements AuditService {
  constructor(private readonly messageQueue: MessageQueue) {}

  async append(context: ExecutionContext, record: AuditRecord) {
    // 使用消息队列异步处理，不阻塞主流程
    await this.messageQueue.publish('audit.record', {
      context,
      record,
    });
  }
}
```

#### 批量处理

对于高并发场景，可以实现批量处理：

```typescript
@Injectable()
export class BatchAuditService implements AuditService {
  private readonly batch: AuditRecord[] = [];
  private readonly batchSize = 100;
  private readonly flushInterval = 5000; // 5秒

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: EntityRepository<AuditLog>,
  ) {
    // 定时批量刷新
    setInterval(() => this.flush(), this.flushInterval);
  }

  async append(context: ExecutionContext, record: AuditRecord) {
    this.batch.push({ context, record });

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush() {
    if (this.batch.length === 0) return;

    const records = this.batch.splice(0);
    await this.auditRepository.insertMany(
      records.map(({ context, record }) => ({
        tenantId: record.tenantId,
        userId: record.userId,
        action: record.action,
        payload: record.payload,
        result: record.result,
        metadata: record.metadata,
        createdAt: new Date(),
      })),
    );
  }
}
```

### 3. 选择性审计

#### 环境配置

根据环境决定是否启用审计：

```typescript
@Module({
  imports: [
    AuditApplicationModule.register({
      auditService: {
        provide: AUDIT_SERVICE_TOKEN,
        useClass: IamAuditService,
      },
      enableAudit: process.env.ENABLE_AUDIT === 'true', // 可配置
    }),
  ],
})
export class AppModule {}
```

#### 操作级别控制

对于某些操作，可以选择性地记录更详细的信息：

```typescript
export class SensitiveOperationCommand extends CommandBase<void> {
  public auditPayload() {
    // 敏感操作记录详细信息
    return {
      action: 'SENSITIVE_OPERATION',
      details: this.getDetailedInfo(),
      timestamp: new Date().toISOString(),
    };
  }
}

export class NormalOperationCommand extends CommandBase<void> {
  public auditPayload() {
    // 普通操作只记录关键信息
    return {
      action: 'NORMAL_OPERATION',
      key: this.key,
    };
  }
}
```

### 4. 错误处理

#### 审计失败不应影响主流程

审计服务应该优雅地处理错误，避免影响主业务流程：

```typescript
@Injectable()
export class ResilientAuditService implements AuditService {
  constructor(
    private readonly logger: Logger,
    @InjectRepository(AuditLog)
    private readonly auditRepository: EntityRepository<AuditLog>,
  ) {}

  async append(context: ExecutionContext, record: AuditRecord) {
    try {
      await this.auditRepository.persistAndFlush(
        this.auditRepository.create({
          tenantId: record.tenantId,
          userId: record.userId,
          action: record.action,
          payload: record.payload,
          result: record.result,
          metadata: record.metadata,
          createdAt: new Date(),
        }),
      );
    } catch (error) {
      // 记录错误但不抛出异常，避免影响主流程
      this.logger.error('审计记录失败', {
        error: error.message,
        record: {
          action: record.action,
          tenantId: record.tenantId,
          userId: record.userId,
        },
      });

      // 可选：发送到监控系统
      // await this.monitoringService.reportError('audit_failed', error);
    }
  }
}
```

### 5. 数据保留策略

#### 实现数据归档

对于长期存储，可以实现数据归档策略：

```typescript
@Injectable()
export class ArchivingAuditService implements AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: EntityRepository<AuditLog>,
    private readonly archiveService: ArchiveService,
  ) {}

  async append(context: ExecutionContext, record: AuditRecord) {
    // 保存到当前表
    await this.auditRepository.persistAndFlush(this.createAuditLog(record));

    // 如果记录超过保留期限，归档到冷存储
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldRecords = await this.auditRepository.find({
      createdAt: { $lt: cutoffDate },
    });

    if (oldRecords.length > 0) {
      await this.archiveService.archive(oldRecords);
      await this.auditRepository.removeAndFlush(oldRecords);
    }
  }
}
```

---

## 常见问题

### Q1: 审计记录会影响性能吗？

**A**: 如果实现得当，影响很小。建议：

- 使用异步审计服务（消息队列）
- 批量处理审计记录
- 选择性审计（只记录关键操作）

### Q2: 如何查询审计记录？

**A**: 可以通过数据库查询或实现专门的查询服务：

```typescript
@Injectable()
export class AuditQueryService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: EntityRepository<AuditLog>,
  ) {}

  async findByUser(userId: string, limit = 100) {
    return this.auditRepository.find(
      { userId },
      { limit, orderBy: { createdAt: 'DESC' } },
    );
  }

  async findByAction(action: string, limit = 100) {
    return this.auditRepository.find(
      { action },
      { limit, orderBy: { createdAt: 'DESC' } },
    );
  }

  async findByTenant(tenantId: string, limit = 100) {
    return this.auditRepository.find(
      { tenantId },
      { limit, orderBy: { createdAt: 'DESC' } },
    );
  }
}
```

### Q3: 如何保护审计记录的完整性？

**A**: 可以：

- 使用数据库事务确保原子性
- 实现审计记录的哈希校验
- 使用只读数据库存储历史审计记录
- 定期备份审计数据

### Q4: 审计记录可以修改吗？

**A**: 审计记录应该是不可变的。建议：

- 使用只读数据库存储历史记录
- 如果需要修正，创建新的修正记录，而不是修改原记录
- 实现审计记录的版本控制

### Q5: 如何处理审计服务的失败？

**A**: 审计失败不应影响主流程。建议：

- 捕获异常并记录日志
- 使用消息队列确保最终一致性
- 实现重试机制
- 监控审计服务的健康状态

### Q6: 如何测试审计功能？

**A**: 可以：

```typescript
describe('CreateUserCommand', () => {
  it('应该记录审计信息', async () => {
    const mockAuditService = {
      append: jest.fn().mockResolvedValue(undefined),
    };

    const handler = new CreateUserHandler(
      mockRepository,
      mockEventBus,
      mockAuditService,
    );

    const command = new CreateUserCommand(context, userData);
    await handler.execute(command);

    expect(mockAuditService.append).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        action: 'CreateUserCommand',
        payload: expect.objectContaining({
          username: userData.username,
        }),
      }),
    );
  });
});
```

---

## 进阶使用

### 1. 自定义审计拦截器

如果需要自定义审计逻辑，可以创建自定义拦截器：

```typescript
@Injectable()
export class CustomAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditCoordinator: AuditCoordinator,
    private readonly customAuditService: CustomAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(async (result) => {
        const request = context.switchToHttp().getRequest();
        const executionContext = request.executionContext;

        if (executionContext) {
          // 自定义审计逻辑
          await this.customAuditService.record({
            context: executionContext,
            request,
            result,
          });
        }
      }),
    );
  }
}
```

### 2. 审计记录加密

对于敏感数据，可以实现加密存储：

```typescript
@Injectable()
export class EncryptedAuditService implements AuditService {
  constructor(
    private readonly encryptionService: EncryptionService,
    @InjectRepository(AuditLog)
    private readonly auditRepository: EntityRepository<AuditLog>,
  ) {}

  async append(context: ExecutionContext, record: AuditRecord) {
    // 加密敏感字段
    const encryptedPayload = await this.encryptionService.encrypt(
      JSON.stringify(record.payload),
    );

    await this.auditRepository.persistAndFlush(
      this.auditRepository.create({
        tenantId: record.tenantId,
        userId: record.userId,
        action: record.action,
        payload: encryptedPayload, // 存储加密后的数据
        result: record.result,
        metadata: record.metadata,
        createdAt: new Date(),
      }),
    );
  }
}
```

### 3. 审计记录分析

实现审计记录分析服务：

```typescript
@Injectable()
export class AuditAnalysisService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: EntityRepository<AuditLog>,
  ) {}

  /**
   * 分析用户操作频率
   */
  async analyzeUserActivity(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.auditRepository.find({
      userId,
      createdAt: { $gte: startDate },
    });

    const actionCounts = logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalActions: logs.length,
      actionCounts,
      mostFrequentAction: Object.entries(actionCounts).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0],
    };
  }

  /**
   * 检测异常操作
   */
  async detectAnomalies(tenantId: string) {
    // 实现异常检测逻辑
    // 例如：检测短时间内大量操作、异常时间操作等
  }
}
```

---

## 总结

`@hl8/audit` 模块提供了完整的审计功能，通过拦截器机制实现零侵入的审计记录。主要特点：

1. **零侵入**：通过拦截器自动记录，业务代码无需修改
2. **统一格式**：标准化的审计记录结构
3. **多租户支持**：自动包含租户和用户信息
4. **可扩展**：支持自定义审计服务实现
5. **类型安全**：完整的 TypeScript 类型支持

**适用场景**：

- 合规与审计要求
- 安全审计
- 业务分析
- 问题排查
- 责任追溯

**最佳实践**：

- 不记录敏感信息
- 使用异步审计服务
- 实现错误处理
- 选择性审计
- 数据保留策略

通过遵循本教程的指导，您可以快速为应用添加完整的审计功能，满足合规、安全和业务分析的需求。

---

## 相关资源

- [@hl8/audit README](../libs/audit/README.md)
- [应用层设计规范](../libs/core/application-base/application-layer-guide.md)
- [ExecutionContext 文档](../libs/common/execution-context/README.md)

---

**文档版本**: 1.0.0  
**最后更新**: 2024-12-19  
**维护者**: hl8 平台团队
