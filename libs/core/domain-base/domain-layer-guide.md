# 领域层设计规范

## 📋 文档概述

本文档定义了基于 DDD + Clean Architecture + CQRS + ES + EDA 混合架构的领域层设计原则和实施规范。领域层是系统的核心，承载业务逻辑和规则，确保业务一致性和不变性。

**⚠️ 强制性要求**：领域层开发**必须**充分使用 `@hl8/domain-base` 提供的核心基线能力。所有聚合根、实体、值对象和领域事件**禁止**直接实现，**必须**继承相应的基类。

**违反此规范的后果**：

- ❌ 无法使用统一的多租户上下文管理
- ❌ 无法使用内置的审计和软删除功能
- ❌ 无法使用统一的领域事件管理
- ❌ 无法使用统一的版本控制和事件溯源支持
- ❌ 代码审查将被拒绝

## 🎯 核心设计理念

### 1.1 领域层定位

**领域层**是系统的**业务核心**和**规则引擎**，在 Clean Architecture 中处于最内层，不依赖任何外部框架或基础设施。

### 1.2 核心原则

- **富领域模型**: 业务逻辑内聚在领域对象中，避免贫血模型
- **聚合设计**: 通过聚合根维护业务不变性和一致性边界
- **值对象优先**: 使用值对象封装概念完整的业务概念
- **事件驱动**: 通过领域事件通知系统状态变化
- **显式建模**: 所有业务概念都应在领域层有对应的显式表达
- **基线能力复用**: **必须**使用 `@hl8/domain-base` 提供的基类和接口，避免重复实现

### 1.3 领域层核心基线能力

`@hl8/domain-base` 提供以下核心基线能力，**所有领域层开发必须使用**。

#### 为什么必须使用基线能力？

基线能力提供了领域层开发的基础设施和统一规范，使用基线能力可以：

1. **统一多租户管理**：所有聚合根自动支持多租户上下文，确保数据隔离
2. **内置审计功能**：自动记录创建者、修改者、创建时间、修改时间等审计信息
3. **软删除支持**：统一的软删除状态管理，支持数据恢复
4. **领域事件管理**：统一的领域事件发布和管理机制
5. **版本控制**：内置版本号管理，支持乐观锁和事件溯源
6. **降低维护成本**：统一的实现方式减少代码重复，便于统一维护和升级
7. **团队协作效率**：统一的代码结构便于团队成员理解和协作

**不使用基线能力的风险**：

- ❌ 每个开发者可能实现不同的多租户管理方式，导致数据隔离问题
- ❌ 需要自行实现审计功能，容易遗漏或出错
- ❌ 无法享受基线能力的统一升级和维护
- ❌ 增加代码审查和维护成本

#### 基线能力列表

| 能力类型         | 基类/接口                 | 说明                                                             | 导入路径           | 是否必须 |
| ---------------- | ------------------------- | ---------------------------------------------------------------- | ------------------ | -------- |
| **聚合根基类**   | `AggregateRootBase<TId>`  | 所有聚合根必须继承此基类，提供多租户、审计、软删除和领域事件管理 | `@hl8/domain-base` | ✅ 必须  |
| **实体基类**     | `EntityBase<TId>`         | 所有实体必须继承此基类，提供唯一标识管理                         | `@hl8/domain-base` | ✅ 必须  |
| **值对象基类**   | `ValueObjectBase<TProps>` | 所有值对象必须继承此基类，提供不可变性和等值比较                 | `@hl8/domain-base` | ✅ 必须  |
| **领域事件基类** | `DomainEventBase`         | 所有领域事件必须继承此基类，提供多租户上下文和审计元数据         | `@hl8/domain-base` | ✅ 必须  |
| **聚合标识**     | `AggregateId`             | 聚合根的唯一标识值对象                                           | `@hl8/domain-base` | ✅ 必须  |
| **租户标识**     | `TenantId`                | 租户标识值对象                                                   | `@hl8/domain-base` | ✅ 必须  |
| **领域异常**     | `DomainException`         | 领域层异常基类                                                   | `@hl8/domain-base` | ✅ 必须  |

## 🔧 基线能力详细说明

### 2.1 AggregateRootBase 聚合根基类

`AggregateRootBase<TId>` 是所有聚合根的基类，提供以下能力：

**提供的功能**：

- ✅ **多租户支持**：通过 `tenantId`、`organizationId`、`departmentId` 管理多租户上下文
- ✅ **审计功能**：通过 `auditTrail` 自动记录创建者、修改者、创建时间、修改时间
- ✅ **软删除支持**：通过 `softDeleteStatus` 管理软删除状态
- ✅ **版本控制**：通过 `version` 支持乐观锁和事件溯源
- ✅ **领域事件管理**：通过 `publishDomainEvent()`、`pullDomainEvents()` 管理领域事件

**必须实现的要求**：

```typescript
import {
  AggregateRootBase,
  AggregateRootProps,
  AggregateId,
  TenantId,
} from '@hl8/domain-base';

export class Order extends AggregateRootBase<AggregateId> {
  protected constructor(props: AggregateRootProps<AggregateId>) {
    super(props); // 必须调用 super(props)
  }

  // 必须实现：确保聚合状态合法
  protected ensureValidState(): void {
    if (!this.tenantId) {
      throw new DomainException('聚合根必须隶属于租户');
    }
    // 其他业务规则验证
  }
}
```

**基类方法说明**：

| 方法                        | 说明               | 使用场景             |
| --------------------------- | ------------------ | -------------------- |
| `tenantId`                  | 获取租户标识       | 多租户数据隔离       |
| `organizationId`            | 获取组织标识       | 组织级数据隔离       |
| `departmentId`              | 获取部门标识       | 部门级数据隔离       |
| `auditTrail`                | 获取审计信息       | 审计日志记录         |
| `softDeleteStatus`          | 获取软删除状态     | 软删除管理           |
| `version`                   | 获取版本号         | 乐观锁和事件溯源     |
| `publishDomainEvent(event)` | 发布领域事件       | 在业务方法中发布事件 |
| `pullDomainEvents()`        | 获取并清空领域事件 | 在应用层处理事件     |
| `ensureValidState()`        | 确保聚合状态合法   | **必须**在子类中实现 |

### 2.2 EntityBase 实体基类

`EntityBase<TId>` 是所有实体的基类，提供唯一标识管理。

**提供的功能**：

- ✅ **唯一标识管理**：通过 `id` 属性管理实体的唯一标识
- ✅ **等值比较**：通过 `equals()` 方法比较实体是否相等

**必须实现的要求**：

```typescript
import { EntityBase, AggregateId } from '@hl8/domain-base';

export class OrderItem extends EntityBase<AggregateId> {
  protected constructor(id: AggregateId) {
    super(id); // 必须调用 super(id)
  }
}
```

### 2.3 ValueObjectBase 值对象基类

`ValueObjectBase<TProps>` 是所有值对象的基类，提供不可变性和等值比较。

**提供的功能**：

- ✅ **不可变性**：通过 `Object.freeze()` 确保值对象不可变
- ✅ **等值比较**：通过 `equals()` 方法比较值对象是否相等
- ✅ **JSON 序列化**：通过 `toJSON()` 方法导出属性

**必须实现的要求**：

```typescript
import { ValueObjectBase } from '@hl8/domain-base';

interface MoneyProps {
  readonly amount: number;
  readonly currency: string;
}

export class Money extends ValueObjectBase<MoneyProps> {
  protected constructor(props: MoneyProps) {
    super(props); // 必须调用 super(props)
  }

  public static create(amount: number, currency: string = 'CNY'): Money {
    // 验证逻辑
    if (amount < 0) {
      throw new DomainException('金额不能为负数');
    }
    return new Money({ amount, currency });
  }
}
```

### 2.4 DomainEventBase 领域事件基类

`DomainEventBase` 是所有领域事件的基类，提供多租户上下文和审计元数据。

**提供的功能**：

- ✅ **多租户上下文**：自动携带租户、组织、部门信息
- ✅ **审计元数据**：自动携带审计信息和软删除状态
- ✅ **事件标识**：通过 `eventId` 唯一标识事件
- ✅ **时间戳**：通过 `occurredAt` 记录事件发生时间

**必须实现的要求**：

```typescript
import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

export interface OrderCreatedEventPayload {
  readonly orderId: string;
  readonly customerId: string;
}

export class OrderCreatedEvent extends DomainEventBase {
  public readonly payload: OrderCreatedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: OrderCreatedEventPayload },
  ) {
    super(props); // 必须调用 super(props)
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'OrderCreatedEvent';
  }
}
```

## 🏗 领域模型结构规范

### 3.1 分层与职责

```
domain/
├── entities/           # 实体
├── aggregates/         # 聚合根
├── value-objects/      # 值对象
├── domain-services/    # 领域服务
├── domain-events/      # 领域事件
├── repositories/       # 仓储接口
├── policies/           # 业务策略
└── specs/              # 规格模式
```

### 3.2 组件职责定义

| 组件类型     | 职责                         | 特征                       | 示例                            |
| ------------ | ---------------------------- | -------------------------- | ------------------------------- |
| **聚合根**   | 维护一致性边界，对外唯一入口 | 有唯一标识，包含业务逻辑   | `Order`, `Product`              |
| **实体**     | 具有生命周期的业务对象       | 有唯一标识，可跟踪状态变化 | `OrderItem`, `Payment`          |
| **值对象**   | 描述业务概念的不变属性       | 无标识，不可变，自验证     | `Money`, `Address`, `TimeRange` |
| **领域服务** | 处理跨聚合的业务逻辑         | 无状态，协调多个领域对象   | `OrderPricingService`           |
| **领域事件** | 记录业务领域中发生的事       | 不可变，命名使用过去时     | `OrderPlacedEvent`              |
| **仓储接口** | 定义聚合持久化契约           | 面向聚合，领域层定义       | `OrderRepository`               |

## 🔧 聚合设计规范

### 4.1 聚合根设计模式

**⚠️ 强制性要求**：所有聚合根**必须**继承 `AggregateRootBase<TId>`。

```typescript
import {
  AggregateRootBase,
  AggregateRootProps,
  AggregateId,
  TenantId,
  DateTimeValueObject,
  UuidGenerator,
  DomainException,
} from '@hl8/domain-base';

// ✅ 正确：使用 AggregateRootBase
export class Order extends AggregateRootBase<AggregateId> {
  private _status: OrderStatus;
  private _items: OrderItem[] = [];
  private _totalAmount: Money;
  private _customerId: CustomerId;

  // 私有构造函数，必须接收 AggregateRootProps
  protected constructor(props: AggregateRootProps<AggregateId>) {
    super(props); // 必须调用 super(props)
    // 初始化逻辑
    this._status = OrderStatus.PENDING;
    this._items = [];
    this._totalAmount = Money.zero();
  }

  // 静态工厂方法 - 主要创建方式
  public static create(tenantId: TenantId, customerId: CustomerId): Order {
    const props: AggregateRootProps<AggregateId> = {
      id: AggregateId.generate(),
      tenantId,
      // 其他属性...
    };
    const order = new Order(props);

    // 发布领域事件
    order.publishDomainEvent(
      new OrderCreatedEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: order.id.toString(),
        tenantId: order.tenantId,
        triggeredBy: null,
        auditMetadata: order.auditTrail,
        softDeleteStatus: order.softDeleteStatus,
        payload: {
          orderId: order.id.toString(),
          customerId: customerId.toString(),
        },
      }),
    );

    return order;
  }

  // 必须实现：确保聚合状态合法
  protected ensureValidState(): void {
    if (!this.tenantId) {
      throw new DomainException('聚合根必须隶属于租户');
    }
    // 其他业务规则验证
  }

  // 业务方法
  public addItem(productId: ProductId, quantity: number, price: Money): void {
    // 业务规则验证
    if (this._status !== OrderStatus.PENDING) {
      throw new OrderModificationError('只能修改待处理状态的订单');
    }

    if (quantity <= 0) {
      throw new InvalidQuantityError('数量必须大于0');
    }

    const existingItem = this._items.find((item) =>
      item.productId.equals(productId),
    );

    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      const newItem = OrderItem.create({
        productId,
        quantity,
        unitPrice: price,
      });
      this._items.push(newItem);
    }

    this.calculateTotal();
  }

  public cancel(reason: string): void {
    // 业务规则
    if (!this.isCancellable()) {
      throw new OrderCancellationError('当前订单状态不可取消');
    }

    this._status = OrderStatus.CANCELLED;

    // ✅ 使用基类提供的 publishDomainEvent 方法
    this.publishDomainEvent(
      new OrderCancelledEvent({
        eventId: UuidGenerator.generate(),
        occurredAt: DateTimeValueObject.now(),
        aggregateId: this.id.toString(),
        tenantId: this.tenantId,
        triggeredBy: null,
        auditMetadata: this.auditTrail,
        softDeleteStatus: this.softDeleteStatus,
        payload: {
          orderId: this.id.toString(),
          reason,
        },
      }),
    );
  }

  // 私有方法封装内部逻辑
  private calculateTotal(): void {
    this._totalAmount = this._items.reduce(
      (total, item) => total.add(item.subtotal),
      Money.zero(),
    );
  }

  private isCancellable(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this._status);
  }

  // 查询方法
  // 注意：id、tenantId、auditTrail 等由基类提供，无需重复定义
  public get status(): OrderStatus {
    return this._status;
  }
  public get totalAmount(): Money {
    return this._totalAmount;
  }
  public get items(): ReadonlyArray<OrderItem> {
    return [...this._items];
  }
}
```

### 4.2 实体设计模式

**⚠️ 强制性要求**：所有实体**必须**继承 `EntityBase<TId>`。

```typescript
import { EntityBase, AggregateId } from '@hl8/domain-base';

// ✅ 正确：使用 EntityBase
export class OrderItem extends EntityBase<AggregateId> {
  private _productId: ProductId;
  private _quantity: number;
  private _unitPrice: Money;

  protected constructor(id: AggregateId, props: OrderItemProps) {
    super(id); // 必须调用 super(id)
    this._productId = props.productId;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
  }

  public static create(props: OrderItemProps): OrderItem {
    return new OrderItem(AggregateId.generate(), props);
  }

  public increaseQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidQuantityError('增加数量必须大于0');
    }
    this._quantity += quantity;
  }

  public updateUnitPrice(newPrice: Money): void {
    if (newPrice.isNegative()) {
      throw new InvalidPriceError('价格不能为负');
    }
    this._unitPrice = newPrice;
  }

  public get subtotal(): Money {
    return this._unitPrice.multiply(this._quantity);
  }

  // 等值比较由基类提供，无需重写
  // 基类的 equals() 方法基于 id 进行比较
}
```

### 4.3 值对象设计模式

**⚠️ 强制性要求**：所有值对象**必须**继承 `ValueObjectBase<TProps>`。

```typescript
import { ValueObjectBase, DomainException } from '@hl8/domain-base';

interface MoneyProps {
  readonly amount: number;
  readonly currency: string;
}

// ✅ 正确：使用 ValueObjectBase
export class Money extends ValueObjectBase<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props); // 必须调用 super(props)，基类会自动冻结属性
  }

  public static create(amount: number, currency: string = 'CNY'): Money {
    // 自验证
    if (amount < 0) {
      throw new DomainException('金额不能为负数');
    }

    if (!currency.match(/^[A-Z]{3}$/)) {
      throw new DomainException('货币格式不正确');
    }

    const roundedAmount = Math.round(amount * 100) / 100; // 保留两位小数
    return new Money({ amount: roundedAmount, currency });
  }

  // 业务操作
  public add(other: Money): Money {
    this.validateSameCurrency(other);
    return Money.create(
      this.props.amount + other.props.amount,
      this.props.currency,
    );
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new DomainException('乘数不能为负数');
    }
    return Money.create(this.props.amount * factor, this.props.currency);
  }

  public isGreaterThan(other: Money): boolean {
    this.validateSameCurrency(other);
    return this.props.amount > other.props.amount;
  }

  private validateSameCurrency(other: Money): void {
    if (this.props.currency !== other.props.currency) {
      throw new DomainException('货币类型不匹配');
    }
  }

  // 等值比较由基类提供，基于 props 的 JSON 序列化比较
  // 无需重写 equals() 方法

  // 静态工厂方法
  public static zero(currency: string = 'CNY'): Money {
    return Money.create(0, currency);
  }

  public static fromString(amountStr: string, currency: string): Money {
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      throw new DomainException('金额格式不正确');
    }
    return Money.create(amount, currency);
  }

  // 获取器
  public get amount(): number {
    return this.props.amount;
  }
  public get currency(): string {
    return this.props.currency;
  }
}
```

## 🎪 领域服务规范

### 5.1 领域服务设计

```typescript
export interface OrderPricingService {
  calculateOrderPrice(order: Order, customer: Customer): OrderPriceCalculation;
}

@DomainService()
export class DefaultOrderPricingService implements OrderPricingService {
  constructor(
    private readonly discountPolicy: DiscountPolicy,
    private readonly taxPolicy: TaxPolicy,
  ) {}

  public calculateOrderPrice(
    order: Order,
    customer: Customer,
  ): OrderPriceCalculation {
    // 计算商品总价
    const itemsTotal = order.items.reduce(
      (total, item) => total.add(item.subtotal),
      Money.zero(),
    );

    // 应用折扣策略
    const discount = this.discountPolicy.calculateDiscount(order, customer);

    // 计算税费
    const tax = this.taxPolicy.calculateTax(
      itemsTotal.subtract(discount.amount),
    );

    // 计算最终价格
    const finalAmount = itemsTotal.subtract(discount.amount).add(tax.amount);

    return new OrderPriceCalculation({
      itemsTotal,
      discount,
      tax,
      finalAmount,
    });
  }
}
```

## 📢 领域事件规范

### 6.1 事件设计模式

**⚠️ 强制性要求**：所有领域事件**必须**继承 `DomainEventBase`。

```typescript
import {
  DomainEventBase,
  DomainEventProps,
  DateTimeValueObject,
  UuidGenerator,
} from '@hl8/domain-base';

// ✅ 正确：使用 DomainEventBase
export interface OrderPlacedEventPayload {
  readonly orderId: string;
  readonly customerId: string;
  readonly totalAmount: number;
  readonly items: Array<{
    readonly productId: string;
    readonly quantity: number;
    readonly unitPrice: number;
  }>;
}

export class OrderPlacedEvent extends DomainEventBase {
  public readonly payload: OrderPlacedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: OrderPlacedEventPayload },
  ) {
    super(props); // 必须调用 super(props)
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'OrderPlacedEvent';
  }
}

export interface OrderCancelledEventPayload {
  readonly orderId: string;
  readonly reason: string;
  readonly cancelledBy: string;
}

export class OrderCancelledEvent extends DomainEventBase {
  public readonly payload: OrderCancelledEventPayload;

  public constructor(
    props: DomainEventProps & { payload: OrderCancelledEventPayload },
  ) {
    super(props); // 必须调用 super(props)
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'OrderCancelledEvent';
  }
}
```

## 🗃 仓储接口规范

### 7.1 仓储接口设计

```typescript
export interface OrderRepository {
  // 查询方法
  findById(id: OrderId): Promise<Order | null>;
  findByCustomerId(customerId: CustomerId): Promise<Order[]>;
  findPendingOrders(): Promise<Order[]>;

  // 保存方法
  save(order: Order): Promise<void>;

  // 删除方法
  delete(order: Order): Promise<void>;

  // 存在性检查
  exists(orderId: OrderId): Promise<boolean>;

  // 事件溯源专用方法
  getEvents(aggregateId: string): Promise<DomainEventBase[]>;
  saveEvents(aggregateId: string, events: DomainEventBase[]): Promise<void>;
}

import type { DomainEventBase } from '@hl8/domain-base';

export interface DomainEventStore {
  saveEvents(aggregateId: string, events: DomainEventBase[]): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEventBase[]>;
  getEventsByType(eventType: string): Promise<DomainEventBase[]>;
}
```

## 🧪 测试规范

### 8.1 领域对象测试

```typescript
import { TenantId, AggregateId } from '@hl8/domain-base';

describe('Order Aggregate', () => {
  describe('创建订单', () => {
    it('应该成功创建待处理状态的订单', () => {
      // Given
      const tenantId = TenantId.create('tenant-1');
      const customerId = CustomerId.create();
      const productId = ProductId.create();

      // When
      const order = Order.create(tenantId, customerId);
      order.addItem(productId, 2, Money.create(100));

      // Then
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount.amount).toBe(200);
      const events = order.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCreatedEvent);
    });

    it('应该拒绝创建空订单', () => {
      // Given
      const tenantId = TenantId.create('tenant-1');
      const customerId = CustomerId.create();

      // When & Then
      // 注意：实际的验证逻辑应该在 ensureValidState() 或业务方法中
      expect(() => {
        const order = Order.create(tenantId, customerId);
        order.ensureValidState(); // 如果业务规则要求订单必须有商品，在这里验证
      }).toThrow(DomainException);
    });
  });

  describe('取消订单', () => {
    it('应该允许取消待处理订单', () => {
      // Given
      const order = createPendingOrder();

      // When
      order.cancel('客户要求取消');

      // Then
      expect(order.status).toBe(OrderStatus.CANCELLED);
      const events = order.pullDomainEvents();
      expect(events).toContainEqual(expect.any(OrderCancelledEvent));
    });

    it('应该拒绝取消已发货订单', () => {
      // Given
      const order = createShippedOrder();

      // When & Then
      expect(() => order.cancel('取消太晚了')).toThrow(OrderCancellationError);
    });
  });
});
```

### 8.2 值对象测试

```typescript
describe('Money ValueObject', () => {
  it('应该正确计算金额加法', () => {
    const money1 = Money.create(100);
    const money2 = Money.create(50);

    const result = money1.add(money2);

    expect(result.amount).toBe(150);
  });

  it('应该拒绝不同货币的金额加法', () => {
    const cnyMoney = Money.create(100, 'CNY');
    const usdMoney = Money.create(50, 'USD');

    expect(() => cnyMoney.add(usdMoney)).toThrow(DomainException);
  });

  it('应该正确判断值对象相等性', () => {
    const money1 = Money.create(100, 'CNY');
    const money2 = Money.create(100, 'CNY');
    const money3 = Money.create(100, 'USD');

    expect(money1.equals(money2)).toBe(true);
    expect(money1.equals(money3)).toBe(false);
  });
});
```

## 🔍 设计决策与最佳实践

### 9.1 聚合设计决策

| 场景             | 推荐方案               | 理由             |
| ---------------- | ---------------------- | ---------------- |
| **一对多关系**   | 子实体包含在聚合内     | 维护强一致性边界 |
| **跨聚合引用**   | 使用ID引用，非对象引用 | 保持聚合边界清晰 |
| **复杂业务规则** | 在聚合根中封装         | 确保业务不变性   |
| **性能考虑**     | 设计小聚合，延迟加载   | 避免大事务锁     |

### 9.2 不变性设计

- **值对象**: 始终不可变，创建后不能修改
- **实体**: 通过业务方法修改状态，不暴露setter
- **领域事件**: 创建后完全不可变
- **聚合**: 内部状态通过受控方法修改

### 9.3 事件溯源集成

`AggregateRootBase` 已经内置了版本控制支持，通过 `version` 属性管理。事件溯源可以通过以下方式实现：

```typescript
import {
  AggregateRootBase,
  AggregateRootProps,
  AggregateId,
  DomainEventBase,
} from '@hl8/domain-base';

// ✅ 正确：AggregateRootBase 已提供版本控制
export class Order extends AggregateRootBase<AggregateId> {
  protected constructor(props: AggregateRootProps<AggregateId>) {
    super(props); // version 由基类管理
  }

  // 从事件重建聚合状态
  public static reconstitute(
    props: AggregateRootProps<AggregateId>,
    events: DomainEventBase[],
  ): Order {
    const order = new Order(props);
    events.forEach((event) => {
      order.applyEvent(event);
    });
    return order;
  }

  // 应用事件改变状态
  protected applyEvent(event: DomainEventBase): void {
    // 具体的状态变更逻辑在子类中实现
    // 注意：版本号由基类自动管理
  }

  protected ensureValidState(): void {
    // 业务规则验证
  }
}
```

## ✅ 基线能力使用检查清单

在开发领域层代码时，**必须**检查以下事项。这是代码审查的**强制性检查项**，任何一项不符合都将导致代码审查失败：

### 基类继承检查（必须）

- ✅ **聚合根是否继承 `AggregateRootBase<TId>`？**
  - ❌ 禁止：直接定义聚合根类而不继承基类
  - ❌ 禁止：继承其他基类而非 `AggregateRootBase`
  - ✅ 必须：构造函数接收 `AggregateRootProps<TId>` 并调用 `super(props)`
  - ✅ 必须：实现 `protected ensureValidState()` 方法

- ✅ **实体是否继承 `EntityBase<TId>`？**
  - ❌ 禁止：直接定义实体类而不继承基类
  - ❌ 禁止：继承其他基类而非 `EntityBase`
  - ✅ 必须：构造函数接收 `AggregateId` 并调用 `super(id)`

- ✅ **值对象是否继承 `ValueObjectBase<TProps>`？**
  - ❌ 禁止：直接定义值对象类而不继承基类
  - ❌ 禁止：继承其他基类而非 `ValueObjectBase`
  - ✅ 必须：构造函数接收属性对象并调用 `super(props)`

- ✅ **领域事件是否继承 `DomainEventBase`？**
  - ❌ 禁止：直接定义领域事件类而不继承基类
  - ❌ 禁止：继承其他基类而非 `DomainEventBase`
  - ✅ 必须：构造函数接收 `DomainEventProps` 并调用 `super(props)`
  - ✅ 必须：实现 `eventName()` 方法

### 多租户和审计检查（必须）

- ✅ **聚合根是否使用多租户上下文？**
  - ✅ 必须：通过 `AggregateRootProps` 传入 `tenantId`
  - ✅ 必须：在 `ensureValidState()` 中验证租户信息

- ✅ **领域事件是否携带多租户上下文？**
  - ✅ 必须：通过 `DomainEventProps` 传入 `tenantId`、`auditMetadata` 等

### 领域事件管理检查（必须）

- ✅ **是否使用基类提供的 `publishDomainEvent()` 方法？**
  - ❌ 禁止：自行实现领域事件管理
  - ✅ 必须：使用 `this.publishDomainEvent(event)` 发布事件

- ✅ **是否使用基类提供的 `pullDomainEvents()` 方法？**
  - ❌ 禁止：直接访问领域事件数组
  - ✅ 必须：使用 `aggregate.pullDomainEvents()` 获取事件

### 代码质量检查

- ✅ **是否使用 `DomainException` 抛出领域异常？**
  - ❌ 禁止：使用通用的 `Error` 或 `Exception`
  - ✅ 必须：使用 `DomainException` 抛出领域异常

- ✅ **值对象是否使用静态工厂方法？**
  - ✅ 推荐：使用 `create()` 静态方法创建值对象
  - ✅ 推荐：在工厂方法中进行验证

## ✅ 总结

本规范确立了领域层设计的核心原则：

1. **模型驱动**: 所有设计围绕领域模型展开
2. **聚合优先**: 通过聚合根维护业务一致性
3. **不可变设计**: 值对象和事件确保状态可预测
4. **显式表达**: 所有业务概念都有对应的代码表达
5. **测试保障**: 通过单元测试验证业务规则正确性
6. **基线能力复用**: **必须**使用 `@hl8/domain-base` 提供的基类和接口，避免重复实现

### 🚨 关键要点

**基线能力使用是强制性的，不是可选的**：

- ✅ **必须**继承 `AggregateRootBase`、`EntityBase`、`ValueObjectBase`、`DomainEventBase`
- ✅ **必须**使用 `AggregateRootProps` 和 `DomainEventProps`
- ✅ **必须**实现 `ensureValidState()` 方法（聚合根）
- ✅ **必须**使用基类提供的 `publishDomainEvent()` 和 `pullDomainEvents()` 方法
- ✅ **必须**使用 `DomainException` 抛出领域异常
- ❌ **禁止**直接实现聚合根、实体、值对象、领域事件
- ❌ **禁止**绕过基类自行实现功能

**违反规范的后果**：

- 代码审查将被拒绝
- 无法享受基线能力提供的统一功能
- 增加维护成本和代码重复

遵循本规范可以构建出表达力强、可维护性高、业务逻辑正确的领域层，为整个系统奠定坚实的基础。

---

_文档版本: 2.0 | 最后更新: 2024-12-XX | 适用项目: DDD 混合架构项目_
