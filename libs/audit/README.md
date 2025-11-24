# @hl8/audit

审计功能模块，提供命令和查询的审计记录能力。

## 📚 文档

- **[完整培训教程](../../docs/training/audit-module-guide.md)** - 详细的使用场景、最佳实践和实际应用示例
- **快速参考** - 本文档提供快速上手和 API 参考

## 功能概述

- **AuditCoordinator** - 审计协调器，统一聚合审计记录
- **AuditCommandInterceptor** - 命令审计拦截器，自动记录命令执行
- **AuditQueryInterceptor** - 查询审计拦截器，自动记录查询执行
- **AuditApplicationModule** - 审计应用层模块，集中注册审计相关组件

## 快速上手

### 1. 安装依赖

```bash
pnpm add @hl8/audit
```

### 2. 实现审计服务

```typescript
import { Injectable } from '@nestjs/common';
import { AuditService, AuditRecord } from '@hl8/audit';
import type { ExecutionContext } from '@hl8/common';

@Injectable()
export class IamAuditService implements AuditService {
  async append<TResult>(
    context: ExecutionContext,
    record: AuditRecord<TResult>,
  ): Promise<void> {
    // 实现审计记录持久化逻辑
    await this.auditRepository.save({
      tenantId: record.tenantId,
      userId: record.userId,
      action: record.action,
      payload: record.payload,
      result: record.result,
      metadata: record.metadata,
      createdAt: new Date(),
    });
  }
}
```

### 3. 注册审计模块

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

## API 文档

### AuditCoordinator

审计协调器，统一聚合审计记录并调用底层审计服务。

```typescript
class AuditCoordinator {
  record<TResult>(
    context: ExecutionContext,
    record: AuditRecord<TResult>,
  ): Promise<void>;
}
```

### AuditCommandInterceptor

命令执行审计拦截器，适用于基于控制器触发的命令请求。

### AuditQueryInterceptor

查询执行审计拦截器，适用于读操作的 API。

### AuditService

审计服务接口，由基础设施层实现。

```typescript
interface AuditService {
  append<TResult>(
    context: ExecutionContext,
    record: AuditRecord<TResult>,
  ): Promise<void> | Observable<void>;
}
```

### AuditRecord

审计记录结构，描述命令或查询的执行信息。

```typescript
interface AuditRecord<TResult = unknown> {
  readonly tenantId: string;
  readonly userId: string;
  readonly action: string;
  readonly payload?: Record<string, unknown>;
  readonly result?: TResult;
  readonly metadata?: Record<string, unknown>;
}
```

## 许可证

MIT
