# 应用层设计规范

## 📋 文档概述

本文档定义了基于 NestJS + DDD + Clean Architecture + CQRS + ES + EDA 混合架构的应用层设计原则和实施规范。旨在建立统一的架构理解和开发标准。

**⚠️ 强制性要求**：应用层开发**必须**充分使用 `@hl8/application-base` 提供的核心基线能力。所有命令、查询、命令处理器和查询处理器**禁止**直接实现 NestJS CQRS 接口，**必须**继承相应的基类。权限校验和审计功能已迁移到 `@hl8/auth`，需要单独集成。

**违反此规范的后果**：

- ❌ 无法使用统一的执行上下文管理
- ❌ 无法使用内置的租户/组织/部门范围校验
- ❌ 无法享受基线能力提供的统一错误处理和日志记录
- ❌ 代码审查将被拒绝

## 🎯 核心设计理念

### 1.1 应用层定位

**应用层用例**是整个系统的**业务流程协调中枢**和**事件驱动工作流引擎**，在六边形架构中充当外部请求与内部领域模型之间的协调者。

### 1.2 核心原则

- **单一用例单一职责**: 每个业务用例对应一个独立的协调单元
- **渐进式复杂化**: 接纳简单用例，为业务演进预留架构空间
- **事件驱动协作**: 通过领域事件实现业务流程解耦
- **技术框架融合**: 在 NestJS CQRS 生态中落地架构理念
- **基线能力复用**: **必须**使用 `@hl8/application-base` 提供的基类和接口，避免重复实现

### 1.3 应用层核心基线能力

`@hl8/application-base` 提供以下核心基线能力，**所有应用层开发必须使用**。

#### 为什么必须使用基线能力？

基线能力提供了应用层开发的基础设施和统一规范，使用基线能力可以：

1. **统一执行流程**：所有命令和查询处理器遵循相同的执行流程，包括上下文验证、错误处理、日志记录等
2. **内置范围校验**：提供统一的租户/组织/部门范围校验方法，确保多租户数据隔离
3. **审计集成支持**：通过 `auditPayload()` 方法自动支持审计功能
4. **降低维护成本**：统一的实现方式减少代码重复，便于统一维护和升级
5. **团队协作效率**：统一的代码结构便于团队成员理解和协作

**不使用基线能力的风险**：

- ❌ 每个开发者可能实现不同的执行流程，导致代码不一致
- ❌ 需要自行实现范围校验，容易出错或遗漏
- ❌ 无法享受基线能力的统一升级和维护
- ❌ 增加代码审查和维护成本

#### 基线能力列表

`@hl8/application-base` 提供以下核心基线能力：

| 能力类型           | 基类/接口               | 说明                                                       | 导入路径                | 是否必须 |
| ------------------ | ----------------------- | ---------------------------------------------------------- | ----------------------- | -------- |
| **命令基类**       | `CommandBase<T>`        | 所有命令必须继承此基类，提供执行上下文和审计载荷支持       | `@hl8/application-base` | ✅ 必须  |
| **查询基类**       | `QueryBase<T>`          | 所有查询必须继承此基类，提供执行上下文和审计载荷支持       | `@hl8/application-base` | ✅ 必须  |
| **命令处理器基类** | `CommandHandler<C, R>`  | 所有命令处理器必须继承此基类，提供统一的执行流程和范围校验 | `@hl8/application-base` | ✅ 必须  |
| **查询处理器基类** | `QueryHandler<Q, R>`    | 所有查询处理器必须继承此基类，提供统一的执行流程和范围校验 | `@hl8/application-base` | ✅ 必须  |
| **执行上下文**     | `ExecutionContext`      | 通用的执行上下文接口，包含租户、用户等信息                 | `@hl8/application-base` | ✅ 必须  |
| **CQRS 基础设施**  | `ApplicationCoreModule` | 提供 CQRS 基础设施注册，必须在使用前注册                   | `@hl8/application-base` | ✅ 必须  |
| **Saga 基类**      | `BaseSaga`              | Saga 模式支持，用于复杂业务流程协调                        | `@hl8/application-base` | ⚪ 可选  |

**权限和审计能力**（已迁移到 `@hl8/auth`）：

| 能力类型             | 模块/组件                  | 说明                   | 导入路径    |
| -------------------- | -------------------------- | ---------------------- | ----------- |
| **权限校验**         | `AuthApplicationModule`    | CASL 权限校验和守卫    | `@hl8/auth` |
| **审计记录**         | `AuthApplicationModule`    | 审计协调器和拦截器     | `@hl8/auth` |
| **执行上下文装饰器** | `@ExecutionContextParam()` | 注入执行上下文到控制器 | `@hl8/auth` |

## 🏗 架构实现规范

### 2.1 技术实现形式

在 NestJS CQRS 架构中，用例以三种形式具象化实现：

| 用例类型     | 实现形式         | 职责说明                   | 示例                      |
| ------------ | ---------------- | -------------------------- | ------------------------- |
| **命令用例** | `CommandHandler` | 处理状态变更，管理事件溯源 | `PlaceOrderHandler`       |
| **查询用例** | `QueryHandler`   | 处理数据查询，支持读写分离 | `GetOrderDetailsHandler`  |
| **事件用例** | `EventHandler`   | 响应领域事件，驱动后续流程 | `OrderPlacedEventHandler` |

**⚠️ 强制性要求**：所有命令和查询处理器**必须**继承 `@hl8/application-base` 提供的基类。

**禁止的做法**：

```typescript
// ❌ 错误：直接实现 ICommandHandler
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
  // ...
}

// ❌ 错误：不继承基类
export class PlaceOrderCommand {
  // ...
}
```

**正确的做法**：

```typescript
// ✅ 正确：继承 CommandBase
export class PlaceOrderCommand extends CommandBase<OrderResult> {
  // ...
}

// ✅ 正确：继承 CommandHandler
export class PlaceOrderHandler extends CommandHandler<
  PlaceOrderCommand,
  OrderResult
> {
  // ...
}
```

### 2.2 代码结构标准

```
src/
├── order/
│   ├── application/
│   │   ├── use-cases/                    # 业务用例组织
│   │   │   ├── place-order/              # 用例分组
│   │   │   │   ├── place-order.command.ts
│   │   │   │   ├── place-order.handler.ts    # 主要实现
│   │   │   │   ├── place-order.saga.ts
│   │   │   │   └── __tests__/
│   │   │   │       ├── place-order.handler.spec.ts
│   │   │   │       └── place-order.use-case.spec.ts
│   │   │   ├── cancel-order/
│   │   │   └── fulfill-order/
│   │   ├── ports/                        # 接口定义
│   │   └── dtos/                         # 数据传输对象
│   ├── domain/                           # 领域层
│   └── infrastructure/                   # 基础设施层
```

## 🔧 基线能力详细说明

### 2.4 CommandBase 和 QueryBase 基类

`CommandBase` 和 `QueryBase` 是所有命令和查询的基类，提供以下能力：

**提供的功能**：

- ✅ **执行上下文管理**：通过 `context` 属性访问执行上下文
- ✅ **审计载荷支持**：通过 `auditPayload()` 方法返回审计所需的数据
- ✅ **类型安全**：泛型支持确保命令/查询与结果类型的一致性

**必须实现的要求**：

```typescript
// ✅ 正确：继承 CommandBase
export class MyCommand extends CommandBase<MyResult> {
  constructor(
    context: ExecutionContext, // 必须接收 ExecutionContext
    public readonly data: MyData,
  ) {
    super(context); // 必须调用 super(context)
  }

  // 可选：重写 auditPayload() 方法提供审计数据
  public auditPayload(): Record<string, unknown> {
    return { data: this.data };
  }
}
```

### 2.5 CommandHandler 和 QueryHandler 基类

`CommandHandler` 和 `QueryHandler` 是所有处理器的基类，提供以下能力：

**提供的功能**：

- ✅ **统一的执行流程**：`execute()` 方法统一处理命令/查询执行
- ✅ **范围校验方法**：
  - `assertTenantScope(context, tenantId, message?)` - 租户范围校验
  - `assertOrganizationScope(context, organizationId, message?)` - 组织范围校验
  - `assertDepartmentScope(context, departmentId, message?)` - 部门范围校验
- ✅ **错误处理**：统一的异常处理机制

**必须实现的要求**：

```typescript
// ✅ 正确：继承 CommandHandler
export class MyCommandHandler extends CommandHandler<MyCommand, MyResult> {
  // 必须实现 protected async handle() 方法
  protected async handle(command: MyCommand): Promise<MyResult> {
    // 使用基类提供的范围校验方法
    this.assertTenantScope(command.context, command.tenantId);

    // 实现业务逻辑
    return result;
  }

  // ❌ 禁止：重写 execute() 方法
  // public async execute(command: MyCommand): Promise<MyResult> { ... }
}
```

**基类方法说明**：

| 方法                                                         | 说明                       | 使用场景                          |
| ------------------------------------------------------------ | -------------------------- | --------------------------------- |
| `execute(command/query)`                                     | 统一的执行入口，由基类提供 | 由 NestJS CQRS 框架调用，不应重写 |
| `handle(command/query)`                                      | 业务逻辑实现，由子类实现   | **必须**在子类中实现此方法        |
| `assertTenantScope(context, tenantId, message?)`             | 校验租户范围               | 在访问租户资源前调用              |
| `assertOrganizationScope(context, organizationId, message?)` | 校验组织范围               | 在访问组织资源前调用              |
| `assertDepartmentScope(context, departmentId, message?)`     | 校验部门范围               | 在访问部门资源前调用              |

## 💻 技术实现模式

### 3.1 模块注册

**必须**注册 `ApplicationCoreModule` 以使用 CQRS 基础设施：

```typescript
import { ApplicationCoreModule } from '@hl8/application-base';
import { AuthApplicationModule } from '@hl8/auth'; // 如果需要权限和审计

@Module({
  imports: [
    // 注册 CQRS 基础设施（必须）
    ApplicationCoreModule.register(),

    // 注册权限和审计能力（可选，如果需要）
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

### 3.2 基础命令处理器模式

**必须**使用 `CommandBase` 和 `CommandHandler`。这是应用层开发的**强制性要求**，违反此规范将导致代码审查失败。

**基线能力提供的功能**：

- ✅ 统一的执行上下文管理
- ✅ 内置的租户/组织/部门范围校验方法（`assertTenantScope`、`assertOrganizationScope`、`assertDepartmentScope`）
- ✅ 统一的错误处理和日志记录
- ✅ 与审计系统的集成支持（通过 `auditPayload()` 方法）

```typescript
import {
  CommandBase,
  CommandHandler,
  ExecutionContext,
} from '@hl8/application-base';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

// 1. 定义命令（必须继承 CommandBase）
export class PlaceOrderCommand extends CommandBase<OrderResult> {
  public constructor(
    context: ExecutionContext, // 使用 ExecutionContext
    public readonly orderDetails: OrderDetails,
  ) {
    super(context);
  }

  // 可选：返回审计所需的载荷
  public auditPayload(): Record<string, unknown> {
    return {
      orderId: this.orderDetails.orderId,
      items: this.orderDetails.items,
    };
  }
}

// 2. 实现命令处理器（必须继承 CommandHandler）
// ⚠️ 注意：必须继承 CommandHandler，不能直接实现 ICommandHandler
@Injectable()
@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler extends CommandHandler<
  PlaceOrderCommand,
  OrderResult
> {
  constructor(
    private readonly repository: EventSourcingRepository<Order>,
    private readonly eventBus: EventBus,
    private readonly inventoryService: InventoryService,
  ) {
    // 注意：CommandHandler 是抽象类，不需要调用 super()
  }

  // 实现业务逻辑（必须实现 handle 方法）
  protected async handle(command: PlaceOrderCommand): Promise<OrderResult> {
    // 1. 业务规则预检查
    await this.validateBusinessRules(command);

    // 2. 创建或重建聚合根
    const order = Order.create(command.orderDetails);

    // 3. 持久化事件流
    await this.repository.save(order);

    // 4. 发布领域事件驱动后续流程
    const domainEvents = order.pullDomainEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
    }

    return OrderResult.from(order);
  }

  private async validateBusinessRules(
    command: PlaceOrderCommand,
  ): Promise<void> {
    // ✅ 使用基类提供的租户范围校验方法
    // 这些方法由 CommandHandler 基类提供，确保统一的校验逻辑
    this.assertTenantScope(command.context, command.orderDetails.tenantId);

    // 也可以使用组织或部门范围校验
    // this.assertOrganizationScope(command.context, command.orderDetails.organizationId);
    // this.assertDepartmentScope(command.context, command.orderDetails.departmentId);

    const available = await this.inventoryService.checkAvailability(
      command.orderDetails.productItems,
    );
    if (!available) {
      throw new InsufficientStockError();
    }
  }
}
```

### 3.3 基础查询处理器模式

**必须**使用 `QueryBase` 和 `QueryHandler`。这是应用层开发的**强制性要求**。

**基线能力提供的功能**：

- ✅ 统一的执行上下文管理
- ✅ 内置的租户/组织/部门范围校验方法
- ✅ 统一的错误处理和日志记录
- ✅ 与审计系统的集成支持

```typescript
import {
  QueryBase,
  QueryHandler,
  ExecutionContext,
} from '@hl8/application-base';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';

// 1. 定义查询（必须继承 QueryBase）
export class GetOrderDetailsQuery extends QueryBase<OrderDetailsDTO | null> {
  public constructor(
    context: ExecutionContext, // 使用 ExecutionContext
    public readonly orderId: string,
  ) {
    super(context);
  }

  // 可选：返回审计所需的查询参数
  public auditPayload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
    };
  }
}

// 2. 实现查询处理器（必须继承 QueryHandler）
// ⚠️ 注意：必须继承 QueryHandler，不能直接实现 IQueryHandler
@Injectable()
@QueryHandler(GetOrderDetailsQuery)
export class GetOrderDetailsHandler extends QueryHandler<
  GetOrderDetailsQuery,
  OrderDetailsDTO | null
> {
  constructor(private readonly orderRepository: OrderRepository) {
    // 注意：QueryHandler 是抽象类，不需要调用 super()
  }

  // 实现查询逻辑（必须实现 handle 方法）
  protected async handle(
    query: GetOrderDetailsQuery,
  ): Promise<OrderDetailsDTO | null> {
    const order = await this.orderRepository.findById(query.orderId);

    if (!order) {
      return null;
    }

    // ✅ 使用基类提供的租户范围校验方法
    // 这些方法由 QueryHandler 基类提供，确保统一的校验逻辑
    this.assertTenantScope(query.context, order.tenantId.toString());

    return OrderDetailsDTO.from(order);
  }
}
```

### 3.4 复杂协调用例模式

当业务协调逻辑足够复杂时，引入明确的 Use Case 类，但处理器仍**必须**继承基类。即使提取了 Use Case 类，处理器也不能绕过基类。

```typescript
@Injectable()
export class OrderFulfillmentUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly shippingService: ShippingService,
    private readonly paymentService: PaymentService,
  ) {}

  async execute(orderId: string): Promise<FulfillmentResult> {
    // 复杂的多聚合协调逻辑
    const [order, inventory] = await Promise.all([
      this.orderRepo.findById(orderId),
      this.inventoryRepo.findByProduct(order.productId),
    ]);

    // 协调多个领域服务
    const reservation = inventory.reserveForOrder(order);
    const shippingLabel = await this.shippingService.createLabel(order);
    const paymentResult = await this.paymentService.process(order);

    // 聚合根行为调用
    order.completeFulfillment(reservation, shippingLabel, paymentResult);

    // 持久化状态变更
    await Promise.all([
      this.orderRepo.save(order),
      this.inventoryRepo.save(inventory),
    ]);

    return FulfillmentResult.from(order, reservation, shippingLabel);
  }
}

// 薄命令处理器（必须继承 CommandHandler）
// ⚠️ 即使逻辑委托给 Use Case，处理器仍必须继承基类
@Injectable()
@CommandHandler(FulfillOrderCommand)
export class FulfillOrderHandler extends CommandHandler<
  FulfillOrderCommand,
  FulfillmentResult
> {
  constructor(private readonly fulfillmentUseCase: OrderFulfillmentUseCase) {
    // 注意：CommandHandler 是抽象类，不需要调用 super()
  }

  protected async handle(
    command: FulfillOrderCommand,
  ): Promise<FulfillmentResult> {
    // ✅ 使用基类提供的租户范围校验
    // 这是基类提供的能力，确保所有处理器都有一致的校验逻辑
    this.assertTenantScope(command.context, command.tenantId);

    return this.fulfillmentUseCase.execute(command.orderId);
  }
}
```

### 3.5 事件处理器模式

事件处理器使用 NestJS CQRS 的标准接口：

```typescript
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@Injectable()
@EventsHandler(OrderPlacedEvent)
export class OrderPlacedHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly inventoryService: InventoryService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    // 异步响应领域事件，协调多个后续动作
    await Promise.all([
      this.inventoryService.reserveItems(event.productItems),
      this.notificationService.sendOrderConfirmation(event.customerId),
      this.analyticsService.trackOrderCreation(event),
    ]);
  }
}
```

### 3.6 控制器集成

在控制器中使用 `@ExecutionContextParam()` 装饰器注入执行上下文。执行上下文类型从 `@hl8/application-base` 导入（通用接口），装饰器从 `@hl8/auth` 导入。

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { ExecutionContext } from '@hl8/application-base'; // 类型定义
import { ExecutionContextParam } from '@hl8/auth'; // 装饰器
import { PlaceOrderCommand } from './place-order.command';

@Controller('orders')
export class OrderController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async placeOrder(
    @Body() dto: CreateOrderDTO,
    @ExecutionContextParam() context: ExecutionContext, // 注入执行上下文
  ): Promise<OrderResult> {
    const command = new PlaceOrderCommand(context, dto);
    return this.commandBus.execute(command);
  }
}
```

## 🔐 权限和审计集成

### 4.1 权限校验

如果需要权限校验，使用 `@hl8/auth` 提供的守卫和装饰器：

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { CaslAbilityGuard, RequireAbility } from '@hl8/auth';
import { CommandBus } from '@nestjs/cqrs';

@Controller('orders')
@UseGuards(CaslAbilityGuard) // 启用权限校验
export class OrderController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @RequireAbility({ action: 'create', subject: 'Order' }) // 标记所需权限
  async placeOrder(
    @Body() dto: CreateOrderDTO,
    @ExecutionContextParam() context: ExecutionContext,
  ): Promise<OrderResult> {
    const command = new PlaceOrderCommand(context, dto);
    return this.commandBus.execute(command);
  }
}
```

### 4.2 审计记录

审计记录由 `AuthApplicationModule` 提供的拦截器自动处理，无需在处理器中手动调用。拦截器会自动从命令/查询的 `auditPayload()` 方法获取审计数据。

**重要**：`auditPayload()` 方法由 `CommandBase` 和 `QueryBase` 基类提供，这是基类能力的一部分。所有命令和查询都可以重写此方法来提供审计数据。

## 🧪 测试策略

### 5.1 命令处理器测试

**必须**使用基类进行测试。测试中需要验证基类提供的能力（如范围校验）是否正常工作。

```typescript
import { CommandHandler, ExecutionContext } from '@hl8/application-base';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { EventBus } from '@nestjs/cqrs';
import { PlaceOrderCommand } from './place-order.command';
import { PlaceOrderHandler } from './place-order.handler';

describe('PlaceOrderHandler', () => {
  let handler: PlaceOrderHandler;
  let mockRepository: MockRepository<Order>;
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockRepository = new MockRepository();
    mockEventBus = {
      publishAll: jest.fn(),
    } as unknown as EventBus;

    handler = new PlaceOrderHandler(
      mockRepository,
      mockEventBus,
      mockInventoryService,
    );
  });

  it('应该处理下单命令并发布领域事件', async () => {
    const context: ExecutionContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };
    const command = new PlaceOrderCommand(context, {
      orderId: 'order-1',
      items: [...],
    });

    const result = await handler.execute(command);

    expect(result.orderId).toBeDefined();
    expect(mockRepository.savedEvents).toHaveLength(1);
    expect(mockEventBus.publishAll).toHaveBeenCalled();
  });
});
```

### 5.2 查询处理器测试

```typescript
import { QueryHandler, ExecutionContext } from '@hl8/application-base';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { GetOrderDetailsQuery } from './get-order-details.query';
import { GetOrderDetailsHandler } from './get-order-details.handler';

describe('GetOrderDetailsHandler', () => {
  let handler: GetOrderDetailsHandler;
  let mockRepository: MockOrderRepository;

  beforeEach(() => {
    mockRepository = new MockOrderRepository();
    handler = new GetOrderDetailsHandler(mockRepository);
  });

  it('应该根据订单ID查询订单详情', async () => {
    const context: ExecutionContext = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };
    const query = new GetOrderDetailsQuery(context, 'order-1');

    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.orderId).toBe('order-1');
  });
});
```

## 📖 沟通与文档规范

### 6.1 术语使用场景

| 场景         | 推荐术语 | 示例                                           | 理由               |
| ------------ | -------- | ---------------------------------------------- | ------------------ |
| **架构设计** | Use Case | "创建订单用例涉及订单聚合和库存上下文"         | 强调业务能力       |
| **代码实现** | Handler  | `PlaceOrderCommandHandler`                     | 符合框架约定       |
| **团队沟通** | Use Case | "这个用例的业务规则是什么？"                   | 统一业务语言       |
| **技术文档** | 两者结合 | "PlaceOrder Use Case (由 CommandHandler 实现)" | 平衡业务与技术视角 |

### 6.2 架构图标注

```
[用户界面]
    → [PlaceOrder Use Case] (CommandHandler extends CommandHandler)
    → [Order Aggregate]
    → [OrderPlaced Event]
    → [Inventory] & [Notification] (EventHandlers)
```

## 🚀 演进与维护

### 7.1 简单到复杂的演进路径

1. **初始阶段**: 直接使用 `CommandHandler` 和 `QueryHandler`
2. **复杂度增加**: 提取 `UseCase` 类封装复杂协调逻辑，处理器仍继承基类
3. **规模扩大**: 按业务能力拆分模块和限界上下文
4. **性能要求**: 引入 CQRS 读写分离和查询专用模型

### 7.2 重构信号

- Handler 方法超过 50 行代码
- 一个 Handler 协调 3 个以上聚合或服务
- 测试 setup 过于复杂
- 业务逻辑开始渗透到 Handler 中

### 7.3 基线能力使用检查清单

在开发应用层代码时，**必须**检查以下事项。这是代码审查的**强制性检查项**，任何一项不符合都将导致代码审查失败：

#### 基类继承检查（必须）

- ✅ **命令是否继承 `CommandBase<T>`？**
  - ❌ 禁止：直接定义命令类而不继承基类
  - ❌ 禁止：继承其他基类而非 `CommandBase`
- ✅ **查询是否继承 `QueryBase<T>`？**
  - ❌ 禁止：直接定义查询类而不继承基类
  - ❌ 禁止：继承其他基类而非 `QueryBase`

- ✅ **命令处理器是否继承 `CommandHandler<C, R>`？**
  - ❌ 禁止：直接实现 `ICommandHandler<C>`
  - ❌ 禁止：继承其他基类而非 `CommandHandler`
  - ✅ 必须：继承 `CommandHandler` 并实现 `protected async handle()` 方法

- ✅ **查询处理器是否继承 `QueryHandler<Q, R>`？**
  - ❌ 禁止：直接实现 `IQueryHandler<Q>`
  - ❌ 禁止：继承其他基类而非 `QueryHandler`
  - ✅ 必须：继承 `QueryHandler` 并实现 `protected async handle()` 方法

#### 执行上下文检查（必须）

- ✅ **是否使用 `ExecutionContext` 接口传递执行上下文？**
  - ❌ 禁止：使用自定义的执行上下文类型
  - ❌ 禁止：直接传递 `tenantId`、`userId` 等原始值
  - ✅ 必须：从 `@hl8/application-base` 导入 `ExecutionContext` 类型

- ✅ **是否使用基类提供的 `assertTenantScope()` 等方法进行范围校验？**
  - ❌ 禁止：自行实现租户范围校验逻辑
  - ❌ 禁止：忽略范围校验
  - ✅ 必须：使用基类提供的 `assertTenantScope()`、`assertOrganizationScope()`、`assertDepartmentScope()` 方法

#### 模块注册检查（必须）

- ✅ **是否在模块中注册了 `ApplicationCoreModule`？**
  - ❌ 禁止：不注册 `ApplicationCoreModule` 就使用 CQRS 功能
  - ✅ 必须：在根模块或功能模块中调用 `ApplicationCoreModule.register()`

- ✅ **如果需要权限和审计，是否注册了 `AuthApplicationModule`？**
  - ⚪ 可选：如果不需要权限和审计功能，可以不注册
  - ✅ 如果需要：必须提供 `abilityService` 和 `auditService` 实现

#### 代码质量检查

- ✅ **是否在命令/查询中实现了 `auditPayload()` 方法？**（推荐）
  - ⚪ 可选：如果不需要审计，可以不实现
  - ✅ 推荐：实现此方法以支持审计功能

- ✅ **是否在处理器中正确使用 `handle()` 方法？**
  - ❌ 禁止：重写 `execute()` 方法
  - ✅ 必须：实现 `protected async handle()` 方法

## ✅ 总结

本规范确立了在 NestJS 混合架构中应用层设计的标准实践：

1. **思想层面**：坚持"用例驱动"和"单一职责"原则
2. **实现层面**：遵循框架约定的 `Handler` 模式，**必须**使用 `@hl8/application-base` 提供的基类
3. **沟通层面**：根据场景灵活使用 `Use Case` 术语
4. **演进层面**：支持从简单到复杂的平滑过渡
5. **能力复用**：**必须**充分使用应用层核心基线能力，避免重复实现

### 🚨 关键要点

**基线能力使用是强制性的，不是可选的**：

- ✅ **必须**继承 `CommandBase`、`QueryBase`、`CommandHandler`、`QueryHandler`
- ✅ **必须**使用 `ExecutionContext` 接口
- ✅ **必须**使用基类提供的范围校验方法（`assertTenantScope`、`assertOrganizationScope`、`assertDepartmentScope`）
- ✅ **必须**注册 `ApplicationCoreModule`
- ✅ **必须**实现 `protected async handle()` 方法，而不是重写 `execute()` 方法
- ❌ **禁止**直接实现 NestJS CQRS 接口（`ICommandHandler`、`IQueryHandler`）
- ❌ **禁止**绕过基类自行实现功能
- ❌ **禁止**不继承基类就实现命令/查询处理器

**违反规范的后果**：

- 代码审查将被拒绝
- 无法享受基线能力提供的统一功能
- 增加维护成本和代码重复

通过严格遵循这套规范，我们能够在享受 NestJS CQRS 框架带来便利的同时，保持代码的领域表现力、架构可持续性和团队协作效率。

---

_文档版本: 2.0 | 最后更新: 2024-12-XX | 适用项目: NestJS DDD 混合架构项目_
