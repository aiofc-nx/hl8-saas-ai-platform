# @hl8/mail

邮件发送服务模块，提供统一的邮件发送功能和常用邮件模板。

## 功能概述

- 提供统一的邮件发送服务，封装 `@nestjs-modules/mailer` 的调用
- 自动处理发件人地址格式，支持 QQ/163 邮箱的特殊要求
- 提供常用邮件模板（注册成功、密码重置、登录通知等）
- 完整的错误处理和日志记录
- 支持通过 `@hl8/config` 进行配置管理
- 符合项目规范，使用 `@hl8/logger` 进行日志记录

## 快速上手

### 1. 安装依赖

```bash
pnpm add @hl8/mail
```

### 2. 配置邮件服务

首先需要配置 `MailerModule`（通过 `NodeMailerModule` 或自定义配置）：

```typescript
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypedConfigModule, dotenvLoader } from '@hl8/config';
import { EnvConfig } from './common/utils/validateEnv';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: EnvConfig,
      load: dotenvLoader(),
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      inject: [EnvConfig],
      useFactory: (config: EnvConfig) => ({
        transport: {
          host: config.MAIL_HOST,
          port: config.MAIL_PORT,
          secure: config.MAIL_SECURE,
          auth: {
            user: config.MAIL_USERNAME,
            pass: config.MAIL_PASSWORD,
          },
        },
      }),
    }),
  ],
})
export class NodeMailerModule {}
```

### 3. 导入邮件模块

在应用模块中导入 `MailModule`：

```typescript
import { Module } from '@nestjs/common';
import { MailModule } from '@hl8/mail';
import { EnvConfig } from './common/utils/validateEnv';

@Module({
  imports: [
    // ... 其他模块
    MailModule.forRoot(EnvConfig),
  ],
})
export class AppModule {}
```

**注意**：`EnvConfig` 需要实现 `MailConfig` 接口，即包含 `MAIL_USERNAME` 属性。

### 4. 使用邮件服务

在服务中注入 `MailService` 并发送邮件：

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '@hl8/mail';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailService.sendEmail({
      to: [email],
      subject: '欢迎注册',
      html: `<h1>欢迎，${name}！</h1>`,
    });
  }
}
```

## 邮件模板

库提供了以下常用邮件模板，可以直接使用：

### 可用模板

- `RegisterSuccessMail` - 注册成功邮件（包含邮箱验证码）
- `ResetPasswordMail` - 重置密码邮件（包含验证码）
- `ConfirmEmailSuccessMail` - 邮箱确认成功通知
- `ChangePasswordSuccessMail` - 修改密码成功通知
- `SignInSuccessMail` - 登录成功通知（包含登录信息）

### 使用模板

```typescript
import { MailService, RegisterSuccessMail, ResetPasswordMail } from '@hl8/mail';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async sendRegistrationEmail(email: string, name: string, otp: string) {
    const html = RegisterSuccessMail({ name, otp });
    await this.mailService.sendEmail({
      to: [email],
      subject: '欢迎注册 - 请验证您的邮箱',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, code: string) {
    const html = ResetPasswordMail({ name, code });
    await this.mailService.sendEmail({
      to: [email],
      subject: '重置密码',
      html,
    });
  }

  async sendLoginNotification(
    email: string,
    username: string,
    device: string,
    ipAddress: string,
    location: string,
  ) {
    const html = SignInSuccessMail({
      username,
      device,
      ipAddress,
      location,
      loginTime: new Date(),
    });
    await this.mailService.sendEmail({
      to: [email],
      subject: '登录通知',
      html,
    });
  }
}
```

## 配置说明

### MailConfig 接口

邮件模块需要配置类实现 `MailConfig` 接口：

```typescript
export interface MailConfig {
  readonly MAIL_USERNAME: string;
}
```

### 环境变量

邮件服务需要以下环境变量（通过 `MailerModule` 配置）：

- `MAIL_HOST` - SMTP 服务器地址或预定义服务名（如 'gmail', 'qq', '163'）
- `MAIL_USERNAME` - 发件人邮箱地址
- `MAIL_PASSWORD` - 邮箱密码或授权码
- `MAIL_PORT` - SMTP 端口（默认 587）
- `MAIL_SECURE` - 是否使用 SSL/TLS（默认 false）

### 预定义服务名

支持以下预定义服务名，nodemailer 会自动处理连接参数：

- `gmail`
- `outlook`
- `yahoo`
- `hotmail`
- `qq`
- `163`
- `126`
- `sina`
- `sohu`

### 特殊邮箱处理

库会自动处理以下邮箱的特殊要求：

- **QQ 邮箱**：使用纯邮箱地址作为发件人（`user@qq.com`），避免退信
- **163/126 邮箱**：同样使用纯邮箱地址作为发件人
- **其他邮箱**：使用带名称的格式（`应用名称 <user@example.com>`）

## API 参考

### MailService

#### sendEmail(mailOptions: ISendMailOptions): Promise<void>

发送邮件。

**参数**：

- `mailOptions` - 邮件选项，包括：
  - `to` - 收件人邮箱地址（字符串或数组）
  - `subject` - 邮件主题
  - `html` - HTML 格式的邮件内容
  - `text` - 纯文本格式的邮件内容（可选）
  - `cc` - 抄送（可选）
  - `bcc` - 密送（可选）
  - `attachments` - 附件（可选）

**返回值**：`Promise<void>`

**异常**：当邮件发送失败时抛出错误

**示例**：

```typescript
await mailService.sendEmail({
  to: ['user@example.com'],
  subject: '测试邮件',
  html: '<h1>这是一封测试邮件</h1>',
  text: '这是一封测试邮件',
});
```

### 邮件模板函数

所有模板函数都返回 HTML 字符串，可以直接用于 `sendEmail` 的 `html` 参数。

#### RegisterSuccessMail(params)

注册成功邮件模板。

**参数**：

- `name: string` - 用户姓名
- `otp: string | number` - 邮箱验证码

#### ResetPasswordMail(params)

重置密码邮件模板。

**参数**：

- `name: string` - 用户姓名
- `code: string | number` - 重置密码验证码

#### ConfirmEmailSuccessMail(params)

邮箱确认成功通知模板。

**参数**：

- `name: string` - 用户姓名

#### ChangePasswordSuccessMail(params)

修改密码成功通知模板。

**参数**：

- `name: string` - 用户姓名

#### SignInSuccessMail(params)

登录成功通知模板。

**参数**：

- `username: string` - 用户名
- `device: string` - 登录设备信息
- `ipAddress: string` - 登录 IP 地址
- `location: string` - 登录位置信息
- `loginTime: Date` - 登录时间

## 测试

### 运行单元测试

```bash
pnpm test
```

### 运行测试并生成覆盖率报告

```bash
pnpm test:cov
```

### 测试邮件发送

库提供了测试脚本，可以直接测试邮件配置：

```bash
# 在 libs/mail 目录下运行
cd libs/mail
pnpm test:email <recipient-email>

# 示例
pnpm test:email test@example.com
```

测试脚本会：

- 自动加载项目根目录的 `.env` 文件
- 验证 SMTP 连接
- 发送测试邮件
- 提供详细的错误诊断和解决方案

## 错误处理

邮件服务在发送失败时会：

1. 记录详细的错误日志（通过 `@hl8/logger`）
2. 重新抛出错误，让调用方处理
3. 提供错误上下文信息（收件人、主题等）

**示例错误处理**：

```typescript
try {
  await mailService.sendEmail({
    to: ['user@example.com'],
    subject: '重要通知',
    html: '<p>内容</p>',
  });
} catch (error) {
  if (error instanceof Error) {
    // 处理邮件发送失败
    console.error('邮件发送失败:', error.message);
    // 可以记录到数据库、发送告警等
  }
}
```

## 最佳实践

1. **配置管理**：使用 `@hl8/config` 统一管理邮件配置，避免硬编码
2. **错误处理**：始终在调用 `sendEmail` 时使用 try-catch 处理异常
3. **日志记录**：邮件服务会自动记录日志，无需手动记录
4. **模板使用**：优先使用库提供的模板，保持邮件风格一致
5. **异步处理**：对于非关键邮件，可以考虑异步发送，避免阻塞主流程

## 目录结构

```
libs/mail
├── README.md                    ← 当前文档
├── eslint.config.mjs            ← ESLint 配置
├── jest.config.ts               ← Jest 测试配置
├── package.json                 ← 模块元信息
├── tsconfig.json                ← TypeScript 配置
├── tsconfig.build.json          ← 构建配置
├── tsconfig.scripts.json        ← 脚本配置
├── scripts
│   └── test-email.ts            ← 邮件测试脚本
└── src
    ├── index.ts                 ← 导出公共 API
    ├── mail.module.ts           ← 邮件模块
    ├── interfaces
    │   └── mail-config.interface.ts  ← 配置接口
    ├── services
    │   ├── mail.service.ts      ← 邮件服务
    │   └── mail.service.spec.ts ← 服务测试
    └── templates
        ├── index.ts             ← 模板导出
        ├── register-success.mail.ts
        ├── reset-password.mail.ts
        ├── confirm-email-success.mail.ts
        ├── change-password-success.mail.ts
        └── sign-in-success.mail.ts
```

## 依赖关系

### 运行时依赖

- `@hl8/config` - 配置管理
- `@hl8/logger` - 日志记录
- `@nestjs-modules/mailer` - 邮件发送
- `@nestjs/common` - NestJS 基础
- `@repo/constants` - 应用常量（APP_NAME）

### 开发依赖

- `@nestjs/testing` - 测试工具
- `tsx` - TypeScript 脚本运行器
- `nodemailer` - 邮件测试脚本使用
- `@types/nodemailer` - TypeScript 类型定义

## 注意事项

1. **MailerModule 配置**：使用方必须先配置 `MailerModule`，`MailModule` 只提供邮件服务封装
2. **配置类要求**：传入 `MailModule.forRoot()` 的配置类必须通过 `TypedConfigModule` 注册为提供者
3. **QQ/163 邮箱**：这些邮箱对发件人地址有特殊要求，库会自动处理
4. **错误处理**：邮件发送失败时会抛出异常，调用方需要处理
5. **日志记录**：所有邮件发送操作都会记录日志，包括成功和失败的情况

## 后续规划

- [ ] 支持邮件队列（异步发送）
- [ ] 支持邮件模板变量替换
- [ ] 支持邮件发送重试机制
- [ ] 提供更多邮件模板
- [ ] 支持邮件发送统计和监控

## 相关文档

- [快速开始指南](./docs/QUICK_START.md) - 5 分钟快速集成
- [详细使用指南](./docs/USAGE_GUIDE.md) - 完整的使用文档和最佳实践
- [Nodemailer 文档](https://nodemailer.com/) - 底层邮件库文档
- [@nestjs-modules/mailer 文档](https://github.com/nest-modules/mailer) - NestJS 邮件模块文档

## 许可证

MIT
