# @hl8/execution-context

通用基础设施模块，提供执行上下文等共享类型和工具函数。

## 功能概述

- **ExecutionContext** - 应用层执行上下文接口，封装多租户身份信息
- **assertExecutionContext** - 校验执行上下文必填字段
- **assertTenantScope** - 校验租户访问范围
- **assertOrganizationScope** - 校验组织访问范围
- **assertDepartmentScope** - 校验部门访问范围

## 快速上手

### 1. 安装依赖

```bash
pnpm add @hl8/execution-context
```

### 2. 使用执行上下文

```typescript
import {
  ExecutionContext,
  assertExecutionContext,
  assertTenantScope,
} from '@hl8/execution-context';

// 定义执行上下文
const context: ExecutionContext = {
  tenantId: 'tenant-123',
  userId: 'user-456',
  organizationIds: ['org-789'],
};

// 校验上下文
const validContext = assertExecutionContext(context);

// 校验租户范围
assertTenantScope(context, 'tenant-123');
```

## API 文档

### ExecutionContext

应用层执行上下文接口，封装执行命令或查询时的多租户身份信息。

```typescript
interface ExecutionContext {
  readonly tenantId: string;
  readonly organizationIds?: readonly string[];
  readonly departmentIds?: readonly string[];
  readonly userId: string;
  readonly metadata?: Record<string, unknown>;
}
```

### assertExecutionContext

校验执行上下文是否包含必填字段。

```typescript
function assertExecutionContext(
  context: ExecutionContext | null | undefined,
): ExecutionContext;
```

### assertTenantScope

校验当前上下文是否允许访问指定租户。

```typescript
function assertTenantScope(
  context: ExecutionContext,
  tenantId: string,
  message?: string,
): void;
```

### assertOrganizationScope

校验当前上下文是否允许访问指定组织。

```typescript
function assertOrganizationScope(
  context: ExecutionContext,
  organizationId: string,
  message?: string,
): void;
```

### assertDepartmentScope

校验当前上下文是否允许访问指定部门。

```typescript
function assertDepartmentScope(
  context: ExecutionContext,
  departmentId: string,
  message?: string,
): void;
```

## 许可证

MIT
