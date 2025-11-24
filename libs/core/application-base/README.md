# @hl8/application-base

`@hl8/application-base` 提供应用层基线能力，包括 CQRS 基础设施、Saga 抽象和通用的执行上下文接口。

## 核心特性

- 标准化的 `CommandBase` 和 `QueryBase` 基类，提供统一的命令和查询接口
- `CommandHandlerBase` 和 `QueryHandlerBase` 基类，简化命令和查询处理器的实现
- 通用的 `ExecutionContext` 接口，用于传递执行上下文信息
- Saga 抽象，支持顺序执行与补偿策略
- 动态模块 `ApplicationCoreModule.register()`，便于在 NestJS 中快速集成 CQRS 基础设施

## 架构说明

**权限和审计能力已迁移到 `@hl8/auth`**

权限校验和审计能力已从 `@hl8/application-base` 迁移到 `@hl8/auth`。如需使用这些功能，请：

1. 使用 `@hl8/auth` 中的 `AuthApplicationModule` 注册权限和审计组件
2. 使用 `@hl8/auth` 中的 `ExecutionContext`、`CaslAbilityGuard`、`AuditCoordinator` 等组件

`@hl8/application-base` 现在专注于提供：

- CQRS 基础设施（命令、查询、事件处理）
- Saga 模式支持
- 通用的执行上下文接口

## 快速开始

### 注册 CQRS 基础设施

```ts
import { ApplicationCoreModule } from '@hl8/application-base';

@Module({
  imports: [ApplicationCoreModule.register()],
})
export class AppModule {}
```

### 注册额外提供者

```ts
import { ApplicationCoreModule } from '@hl8/application-base';

@Module({
  imports: [
    ApplicationCoreModule.register({
      extraProviders: [MyCustomProvider],
    }),
  ],
})
export class AppModule {}
```

### 实现命令和查询

**定义命令**：

```ts
import { CommandBase, ExecutionContext } from '@hl8/application-base';

export class CreateUserCommand extends CommandBase<void> {
  public constructor(
    context: ExecutionContext,
    public readonly email: string,
    public readonly username: string,
  ) {
    super(context);
  }

  public auditPayload(): Record<string, unknown> {
    return {
      email: this.email,
      username: this.username,
    };
  }
}
```

**实现命令处理器**：

```ts
import { CommandHandlerBase } from '@hl8/application-base';
import { Injectable } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler extends CommandHandlerBase<
  CreateUserCommand,
  void
> {
  protected async handle(command: CreateUserCommand): Promise<void> {
    // 实现业务逻辑
    // 可以使用 command.context 访问执行上下文
    this.assertTenantScope(command.context, 'tenant-id');
  }
}
```

**定义查询**：

```ts
import { QueryBase, ExecutionContext } from '@hl8/application-base';

export class GetUserQuery extends QueryBase<UserDTO | null> {
  public constructor(
    context: ExecutionContext,
    public readonly userId: string,
  ) {
    super(context);
  }

  public auditPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
    };
  }
}
```

**实现查询处理器**：

```ts
import { QueryHandlerBase } from '@hl8/application-base';
import { Injectable } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';

@Injectable()
@QueryHandler(GetUserQuery)
export class GetUserHandler extends QueryHandlerBase<
  GetUserQuery,
  UserDTO | null
> {
  protected async handle(query: GetUserQuery): Promise<UserDTO | null> {
    // 实现查询逻辑
    // 可以使用 query.context 访问执行上下文
    this.assertTenantScope(query.context, 'tenant-id');
    return null;
  }
}
```

## 与 @hl8/auth 集成

如果需要权限校验和审计功能，请同时使用 `@hl8/auth`：

```ts
import { ApplicationCoreModule } from '@hl8/application-base';
import { AuthApplicationModule } from '@hl8/auth';

@Module({
  imports: [
    // 注册 CQRS 基础设施
    ApplicationCoreModule.register(),
    // 注册权限和审计组件
    AuthApplicationModule.register({
      abilityService: {
        provide: ABILITY_SERVICE_TOKEN,
        useClass: AbilityServiceImpl,
      },
      auditService: {
        provide: AUDIT_SERVICE_TOKEN,
        useClass: AuditServiceImpl,
      },
    }),
  ],
})
export class AppModule {}
```

## 组件说明

### CQRS 基础设施

- **`CommandBase<T>`**：命令基类，所有命令都应继承此类
- **`QueryBase<T>`**：查询基类，所有查询都应继承此类
- **`CommandHandlerBase<C, R>`**：命令处理器基类，提供统一的处理接口
- **`QueryHandlerBase<Q, R>`**：查询处理器基类，提供统一的处理接口
- **`ExecutionContext`**：通用的执行上下文接口，包含租户、用户等信息

### Saga 支持

- **`BaseSaga`**：Saga 基类，支持顺序执行与补偿策略
- **`SagaStep`**：Saga 步骤接口

## 测试

```bash
pnpm --filter @hl8/application-base test
```

## 运维核对清单

- 核查 TSDoc 是否覆盖公共 API
- 确认命令/查询处理器的单元测试通过，覆盖率 ≥80%
- 在集成测试中验证 CQRS 流程的正确性
