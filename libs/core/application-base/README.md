# @hl8/application-base

`@hl8/application-base` 提供命令、查询、Saga、权限校验与审计协同的应用层基线能力，帮助业务模块在 1 个工作日内完成接入。

## 核心特性

- 标准化的 `SecurityContext` 与租户/组织/部门范围校验工具。
- 基于 CASL 的命令、查询处理器基类，自动执行权限校验。
- 审计协调器与拦截器，统一写入审计日志并复用平台日志规范。
- Saga 抽象，支持顺序执行与补偿策略。
- 动态模块 `ApplicationCoreModule.register()`，便于在 NestJS 中快速集成。

## 使用场景

### 何时使用 ApplicationCoreModule（聚合模块）

适合以下场景：

- ✅ **标准应用**：需要完整的权限校验和审计能力
- ✅ **快速接入**：希望在 1 个工作日内完成接入
- ✅ **团队规范**：遵循平台统一的应用层基线能力

### 何时独立注册组件

适合以下场景：

- ✅ **定制需求**：只需要部分能力（如仅权限校验或仅审计）
- ✅ **性能优化**：需要精确控制组件的注册和初始化
- ✅ **灵活配置**：需要自定义拦截器的注册顺序或配置

## 快速开始

### 方式 1：使用聚合模块（推荐）

注册所有组件：

```ts
@Module({
  imports: [
    ApplicationCoreModule.register({
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

### 方式 2：选择性注册组件

只注册权限相关组件：

```ts
@Module({
  imports: [
    ApplicationCoreModule.register({
      abilityService: {
        provide: ABILITY_SERVICE_TOKEN,
        useClass: AbilityServiceImpl,
      },
      enableAudit: false, // 禁用审计相关组件
    }),
  ],
})
export class AppModule {}
```

只注册审计相关组件：

```ts
@Module({
  imports: [
    ApplicationCoreModule.register({
      auditService: {
        provide: AUDIT_SERVICE_TOKEN,
        useClass: AuditServiceImpl,
      },
      enableAbility: false, // 禁用权限相关组件
    }),
  ],
})
export class AppModule {}
```

### 方式 3：独立注册组件

如果聚合模块无法满足需求，可以独立注册组件：

```ts
import { CqrsModule } from '@nestjs/cqrs';
import {
  CaslAbilityCoordinator,
  AuditCoordinator,
  AuditCommandInterceptor,
  AuditQueryInterceptor,
  ABILITY_SERVICE_TOKEN,
  AUDIT_SERVICE_TOKEN,
} from '@hl8/application-base';

@Module({
  imports: [CqrsModule],
  providers: [
    // 只注册权限相关组件
    CaslAbilityCoordinator,
    { provide: ABILITY_SERVICE_TOKEN, useClass: AbilityServiceImpl },

    // 只注册审计相关组件（可选）
    // AuditCoordinator,
    // AuditCommandInterceptor,
    // AuditQueryInterceptor,
    // { provide: AUDIT_SERVICE_TOKEN, useClass: AuditServiceImpl },
  ],
  exports: [
    CaslAbilityCoordinator,
    ABILITY_SERVICE_TOKEN,
    // AuditCoordinator,
    // AuditCommandInterceptor,
    // AuditQueryInterceptor,
    // AUDIT_SERVICE_TOKEN,
  ],
})
export class AppModule {}
```

2. **实现命令处理器**

   ```ts
   export class AssignRoleCommand extends CaslCommandBase<void> {
     public constructor(
       context: SecurityContext,
       public readonly payload: { tenantId: string; roleId: string },
     ) {
       super(context);
     }

     public abilityDescriptor() {
       return { action: 'manage', subject: 'AssignRoleCommand' };
     }

     public override auditPayload() {
       return this.payload;
     }
   }
   ```

3. **继承命令处理器基类**
   ```ts
   @CommandHandler(AssignRoleCommand)
   export class AssignRoleCommandHandler extends CaslCommandHandler<
     AssignRoleCommand,
     void
   > {
     protected async handle(command: AssignRoleCommand): Promise<void> {
       this.assertTenantScope(command, command.payload.tenantId);
       // 领域逻辑...
     }
   }
   ```

更详细的接入示例见 `specs/002-define-application-base/quickstart.md`。

## 组件说明

### 权限相关组件

- **`CaslAbilityCoordinator`**：权限协调器，统一校验命令与查询执行权限
- **`abilityService`**：权限服务，提供权限能力解析（需实现 `AbilityService` 接口）

### 审计相关组件

- **`AuditCoordinator`**：审计协调器，统一聚合审计记录
- **`AuditCommandInterceptor`**：命令审计拦截器，自动记录命令执行
- **`AuditQueryInterceptor`**：查询审计拦截器，自动记录查询执行
- **`auditService`**：审计服务，提供审计记录持久化（需实现 `AuditService` 接口）

### 依赖关系

- `AuditCommandInterceptor` 和 `AuditQueryInterceptor` 依赖于 `AuditCoordinator`
- 如果启用审计，必须提供 `auditService`
- 如果启用权限，必须提供 `abilityService`

## 选择指南

**使用聚合模块（推荐）**：

- ✅ 标准应用，需要完整的权限校验和审计能力
- ✅ 快速接入，希望在 1 个工作日内完成
- ✅ 遵循团队规范，使用平台统一的应用层基线能力

**选择性注册组件**：

- ✅ 只需要部分能力（如仅权限校验或仅审计）
- ✅ 想要减少不必要的依赖

**独立注册组件**：

- ✅ 需要精确控制组件的注册和初始化顺序
- ✅ 需要自定义拦截器的配置或行为
- ✅ 性能优化，需要细粒度控制

## 测试

```bash
pnpm --filter @hl8/application-base test
```

## 运维核对清单

- 核查 TSDoc 是否覆盖公共 API。
- 确认命令/查询/协同器的单元测试通过，覆盖率 ≥80%。
- 在集成测试中验证权限拒绝与审计记录链路。
