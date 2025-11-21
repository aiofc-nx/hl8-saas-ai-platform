# @hl8/logger

**企业级日志基础设施模块** - 适用于任何 Node.js 和 NestJS 应用

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/hl8/logger)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com/)

---

## ⚡ 特性

### 完全类型安全 ✅

- TypeScript 类型推断和自动补全
- 编译时类型检查
- 运行时类型验证

### 高性能日志记录 🚀

- 基于 Pino 的高性能日志记录
- 支持所有标准日志级别（trace, debug, info, warn, error, fatal）
- 自动 HTTP 请求/响应日志记录
- 低开销的日志序列化

### 请求上下文管理 🔄

- 自动请求作用域隔离
- 支持请求级别的字段绑定
- 上下文自动传播到所有异步操作

### NestJS 深度集成 🎯

- 兼容 NestJS LoggerService 接口
- 支持依赖注入和装饰器注入
- 全局模块支持
- 与 NestJS 异常处理器兼容

### 灵活的配置选项 ⚙️

- 支持同步和异步配置
- 可自定义上下文字段名称
- 可配置路由排除和包含
- 支持自定义错误键名

---

## 🚀 快速开始

### 安装

```bash
pnpm add @hl8/logger
```

### 基础使用

```typescript
import { LoggerModule } from '@hl8/logger';
import { Module } from '@nestjs/common';

// 在模块中导入
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        autoLogging: true,
      },
    }),
  ],
})
export class AppModule {}

// 在服务中使用
import { Injectable } from '@nestjs/common';
import { Logger } from '@hl8/logger';

@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  async createUser(userData: CreateUserDto) {
    this.logger.log('创建用户', 'UserService');
    // ... 业务逻辑
  }
}
```

---

## 📖 核心概念

### LoggerModule

核心日志模块，提供全局日志服务。

```typescript
LoggerModule.forRoot({
  pinoHttp: {
    level: 'info',
    autoLogging: true,
  },
  exclude: [{ path: '/health', method: RequestMethod.GET }],
  renameContext: 'module',
});
```

### Logger

NestJS 日志服务适配器，实现了 NestJS 的 LoggerService 接口。

```typescript
// 通过依赖注入使用
@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  logMessage() {
    this.logger.log('信息日志', 'UserService');
    this.logger.error('错误日志', 'UserService');
  }
}
```

### PinoLogger

基于 Pino 的日志记录器实现，提供更底层的日志功能。

```typescript
// 通过依赖注入使用
@Injectable()
export class UserService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('UserService');
  }

  logWithContext() {
    this.logger.info('用户创建成功', { userId: 123 });
  }
}
```

### 装饰器注入

使用 `InjectPinoLogger` 装饰器自动注入已配置上下文的日志记录器。

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectPinoLogger('UserService') private readonly logger: PinoLogger,
  ) {}

  logMessage() {
    // 日志中会自动包含 context: 'UserService'
    this.logger.info('用户创建成功');
  }
}
```

---

## 📚 使用场景

### 基础日志记录

```typescript
// 字符串消息
this.logger.log('用户登录成功', 'AuthService');

// 对象消息
this.logger.log({ userId: 123, loginTime: new Date() }, 'AuthService');

// Error 对象
this.logger.error(new Error('数据库连接失败'), 'DatabaseService');
```

### 自定义上下文名称

```typescript
LoggerModule.forRoot({
  renameContext: 'module',
  // 日志输出：{"level":30, ... "module":"AuthService"}
});
```

### 路由排除

```typescript
LoggerModule.forRoot({
  exclude: [
    { path: '/health', method: RequestMethod.GET },
    { path: '/metrics', method: RequestMethod.GET },
  ],
});
```

### 请求作用域字段绑定

```typescript
// 在请求处理过程中
this.logger.assign({ userId: 123, requestId: 'req-456' });

// 后续所有日志都会自动包含 userId 和 requestId
this.logger.info('处理请求');
// 输出：{"level":30, ... "userId":123, "requestId":"req-456"}
```

### 异步配置

```typescript
LoggerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    pinoHttp: {
      level: configService.get('LOG_LEVEL', 'info'),
    },
  }),
  inject: [ConfigService],
});
```

### 错误拦截器

```typescript
// 全局注册错误拦截器
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerErrorInterceptor } from '@hl8/logger';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerErrorInterceptor,
    },
  ],
})
export class AppModule {}
```

---

## 🔧 高级功能

### 自定义 Pino 配置

```typescript
LoggerModule.forRoot({
  pinoHttp: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
    customAttributeKeys: {
      err: 'error',
      req: 'request',
      res: 'response',
    },
  },
});
```

### 使用已存在的日志实例

```typescript
// 当使用 FastifyAdapter 且已在适配器中配置日志时
LoggerModule.forRoot({
  useExisting: true,
});
```

### 响应日志字段分配

```typescript
LoggerModule.forRoot({
  assignResponse: true,
  // 调用 logger.assign() 时，响应日志也会包含分配的字段
});
```

---

## 📊 API 文档

### LoggerModule

#### `forRoot(params?: Params): DynamicModule`

同步配置日志模块。

**参数**：

- `params` (可选): 日志模块配置参数

**返回**: 动态模块配置

#### `forRootAsync(params: LoggerModuleAsyncParams): DynamicModule`

异步配置日志模块。

**参数**：

- `params`: 异步配置参数对象
  - `useFactory`: 工厂函数，用于生成配置参数
  - `inject`: 需要注入的依赖令牌列表（可选）
  - `imports`: 需要导入的模块列表（可选）
  - `providers`: 需要提供的其他提供者列表（可选）

**返回**: 动态模块配置

### Logger

实现了 NestJS 的 `LoggerService` 接口。

#### `verbose(message: any, ...optionalParams: any[]): void`

记录详细日志（trace 级别）。

#### `debug(message: any, ...optionalParams: any[]): void`

记录调试日志。

#### `log(message: any, ...optionalParams: any[]): void`

记录信息日志（info 级别）。

#### `warn(message: any, ...optionalParams: any[]): void`

记录警告日志。

#### `error(message: any, ...optionalParams: any[]): void`

记录错误日志。

#### `fatal(message: any, ...optionalParams: any[]): void`

记录致命错误日志。

### PinoLogger

基于 Pino 的日志记录器实现。

#### `setContext(value: string): void`

设置日志上下文名称。

**参数**：

- `value`: 上下文名称字符串

#### `assign(fields: pino.Bindings): void`

为当前请求作用域内的日志记录器绑定额外的字段。

**参数**：

- `fields`: 要绑定的字段对象

**抛出**: 如果在请求作用域外调用此方法，会抛出错误

#### 日志方法

- `trace(msg: string, ...args: any[]): void`
- `trace(obj: unknown, msg?: string, ...args: any[]): void`
- `debug(msg: string, ...args: any[]): void`
- `debug(obj: unknown, msg?: string, ...args: any[]): void`
- `info(msg: string, ...args: any[]): void`
- `info(obj: unknown, msg?: string, ...args: any[]): void`
- `warn(msg: string, ...args: any[]): void`
- `warn(obj: unknown, msg?: string, ...args: any[]): void`
- `error(msg: string, ...args: any[]): void`
- `error(obj: unknown, msg?: string, ...args: any[]): void`
- `fatal(msg: string, ...args: any[]): void`
- `fatal(obj: unknown, msg?: string, ...args: any[]): void`

### InjectPinoLogger

#### `InjectPinoLogger(context?: string): ParameterDecorator`

依赖注入装饰器，用于注入已配置上下文的日志记录器。

**参数**：

- `context`: 日志上下文名称，默认为空字符串

**返回**: NestJS 参数装饰器

### LoggerErrorInterceptor

错误拦截器，用于捕获请求处理过程中的错误并将其绑定到响应对象上。

#### `intercept(context: ExecutionContext, next: CallHandler): Observable<any>`

拦截请求处理，捕获错误并绑定到响应对象。

---

## 📝 配置参数

### Params

日志模块配置参数接口。

```typescript
interface Params {
  // Pino HTTP 中间件配置参数
  pinoHttp?: Options | DestinationStream | [Options, DestinationStream];

  // 需要排除日志记录的路由
  exclude?: Parameters<MiddlewareConfigProxy['exclude']>;

  // 需要应用日志中间件的路由
  forRoutes?: Parameters<MiddlewareConfigProxy['forRoutes']>;

  // 是否使用已存在的日志实例
  useExisting?: true;

  // 重命名上下文字段名称
  renameContext?: string;

  // 是否为响应日志分配字段
  assignResponse?: boolean;
}
```

---

## 🧪 测试

本模块使用 Jest 进行测试。测试文件使用 `.spec.ts` 后缀，与源代码文件同目录。

**运行测试**：

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监听模式运行测试
pnpm test:watch
```

**测试文件位置**：

- 单元测试：`src/**/*.spec.ts`（与源代码同目录）
- 测试遵循就近原则，便于维护和理解

---

## 📦 依赖要求

- **Node.js**: >= 20
- **TypeScript**: >= 5.9
- **NestJS**: >= 11

---

## 🎯 最佳实践

### 上下文管理

- 使用 `InjectPinoLogger` 装饰器自动设置上下文
- 在服务构造函数中设置上下文名称
- 使用有意义的上下文名称，便于日志查询

### 日志级别使用

- `trace`: 非常详细的调试信息，仅在开发环境启用
- `debug`: 开发和调试阶段的调试信息
- `info`: 一般性的业务信息，记录应用正常运行状态
- `warn`: 警告信息，可能存在问题但不影响应用运行
- `error`: 错误信息，记录错误和异常情况
- `fatal`: 致命错误，导致应用无法继续运行的严重错误

### 性能优化

- 在生产环境中禁用 trace 和 debug 级别日志
- 使用结构化日志（对象形式）而非字符串拼接
- 避免在日志中记录大型对象或敏感信息

### 错误处理

- 始终使用错误拦截器记录异常
- 在错误日志中包含足够的上下文信息
- 使用结构化日志格式记录错误详情

---

## 📚 相关文档

- [项目源码](../../../)
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Pino 官方文档](https://getpino.io/)
- [pino-http 文档](https://github.com/pinojs/pino-http)

---

## 📝 许可证

MIT

---

**高性能、类型安全、易于使用的企业级日志解决方案！** 🎯
