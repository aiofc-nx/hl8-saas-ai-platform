# @hl8/mail 使用指南

本文档提供 `@hl8/mail` 库的详细使用指南，包括配置、集成和最佳实践。

> 💡 **提示**：如果您是第一次使用，建议先查看 [快速开始指南](./QUICK_START.md)。

## 目录

- [安装和配置](#安装和配置)
- [基础使用](#基础使用)
- [邮件模板](#邮件模板)
- [高级功能](#高级功能)
- [测试](#测试)
- [故障排查](#故障排查)

## 安装和配置

### 1. 安装依赖

```bash
pnpm add @hl8/mail
```

### 2. 配置环境变量

在项目根目录的 `.env` 文件中配置邮件相关环境变量：

```env
# SMTP 服务器配置
MAIL_HOST=smtp.example.com
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-password-or-auth-code
MAIL_PORT=587
MAIL_SECURE=false

# 如果使用预定义服务名（如 Gmail、QQ 等）
# MAIL_HOST=gmail
# MAIL_HOST=qq
# MAIL_HOST=163
```

### 3. 配置 MailerModule

在应用模块中配置 `MailerModule`：

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
      useFactory: (config: EnvConfig) => {
        const predefinedServices = [
          'gmail',
          'outlook',
          'yahoo',
          'hotmail',
          'qq',
          '163',
          '126',
          'sina',
          'sohu',
        ];

        const isPredefinedService = predefinedServices.includes(
          config.MAIL_HOST.toLowerCase(),
        );

        const transport = isPredefinedService
          ? {
              service: config.MAIL_HOST,
              auth: {
                user: config.MAIL_USERNAME,
                pass: config.MAIL_PASSWORD,
              },
            }
          : {
              host: config.MAIL_HOST,
              port: config.MAIL_PORT,
              secure: config.MAIL_SECURE,
              auth: {
                user: config.MAIL_USERNAME,
                pass: config.MAIL_PASSWORD,
              },
            };

        return { transport };
      },
    }),
  ],
})
export class NodeMailerModule {}
```

### 4. 导入 MailModule

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

## 基础使用

### 发送简单邮件

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '@hl8/mail';

@Injectable()
export class NotificationService {
  constructor(private readonly mailService: MailService) {}

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailService.sendEmail({
      to: [email],
      subject: '欢迎注册',
      html: `
        <h1>欢迎，${name}！</h1>
        <p>感谢您注册我们的服务。</p>
      `,
    });
  }
}
```

### 发送带附件的邮件

```typescript
await this.mailService.sendEmail({
  to: ['user@example.com'],
  subject: '报告附件',
  html: '<p>请查看附件中的报告。</p>',
  attachments: [
    {
      filename: 'report.pdf',
      path: '/path/to/report.pdf',
    },
  ],
});
```

### 发送给多个收件人

```typescript
await this.mailService.sendEmail({
  to: ['user1@example.com', 'user2@example.com'],
  cc: ['manager@example.com'],
  bcc: ['archive@example.com'],
  subject: '团队通知',
  html: '<p>这是一封团队通知邮件。</p>',
});
```

## 邮件模板

### 使用内置模板

库提供了多个常用邮件模板，可以直接使用：

```typescript
import {
  MailService,
  RegisterSuccessMail,
  ResetPasswordMail,
  SignInSuccessMail,
} from '@hl8/mail';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  // 注册成功邮件
  async sendRegistrationEmail(email: string, name: string, otp: string) {
    const html = RegisterSuccessMail({ name, otp });
    await this.mailService.sendEmail({
      to: [email],
      subject: '欢迎注册 - 请验证您的邮箱',
      html,
    });
  }

  // 重置密码邮件
  async sendPasswordResetEmail(email: string, name: string, code: string) {
    const html = ResetPasswordMail({ name, code });
    await this.mailService.sendEmail({
      to: [email],
      subject: '重置密码',
      html,
    });
  }

  // 登录通知邮件
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

### 自定义模板

如果需要自定义模板，可以创建自己的模板函数：

```typescript
export const CustomMailTemplate = ({
  name,
  data,
}: {
  name: string;
  data: any;
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>自定义邮件</title>
    </head>
    <body>
      <h1>你好，${name}！</h1>
      <p>${data.message}</p>
    </body>
    </html>
  `;
};

// 使用
const html = CustomMailTemplate({
  name: '张三',
  data: { message: '这是一条消息' },
});
await this.mailService.sendEmail({
  to: ['user@example.com'],
  subject: '自定义邮件',
  html,
});
```

## 高级功能

### 错误处理

邮件发送可能因为各种原因失败，建议始终使用 try-catch 处理：

```typescript
async sendEmailWithRetry(email: string, subject: string, html: string) {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await this.mailService.sendEmail({
        to: [email],
        subject,
        html,
      });
      return; // 发送成功，退出
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`邮件发送失败（尝试 ${i + 1}/${maxRetries}）:`, lastError.message);

      // 如果不是最后一次尝试，等待后重试
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // 所有重试都失败，抛出错误
  throw new Error(`邮件发送失败，已重试 ${maxRetries} 次: ${lastError?.message}`);
}
```

### 异步发送（队列）

对于非关键邮件，可以考虑使用队列异步发送：

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '@hl8/mail';

@Injectable()
export class EmailQueueService {
  constructor(private readonly mailService: MailService) {}

  async queueEmail(email: string, subject: string, html: string) {
    // 将邮件任务加入队列（可以使用 Bull、RabbitMQ 等）
    // 这里只是示例
    setImmediate(async () => {
      try {
        await this.mailService.sendEmail({
          to: [email],
          subject,
          html,
        });
      } catch (error) {
        console.error('异步邮件发送失败:', error);
        // 可以记录到数据库或发送告警
      }
    });
  }
}
```

### 批量发送

```typescript
async sendBulkEmails(
  recipients: string[],
  subject: string,
  html: string,
) {
  const results = await Promise.allSettled(
    recipients.map(email =>
      this.mailService.sendEmail({
        to: [email],
        subject,
        html,
      }),
    ),
  );

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failureCount = results.filter(r => r.status === 'rejected').length;

  console.log(`批量发送完成: 成功 ${successCount}，失败 ${failureCount}`);

  return { successCount, failureCount };
}
```

## 测试

### 单元测试

在测试中 mock `MailService`：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '@hl8/mail';

describe('AuthService', () => {
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    mailService = module.get(MailService);
  });

  it('应该发送注册邮件', async () => {
    await authService.sendRegistrationEmail(
      'test@example.com',
      'Test',
      '123456',
    );

    expect(mailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['test@example.com'],
        subject: '欢迎注册 - 请验证您的邮箱',
      }),
    );
  });
});
```

### 集成测试

使用测试脚本验证邮件配置：

```bash
cd libs/mail
pnpm test:email test@example.com
```

## 故障排查

### 常见问题

#### 1. 认证失败

**错误信息**：`Authentication failed` 或 `Invalid login`

**解决方案**：

- 检查 `MAIL_USERNAME` 和 `MAIL_PASSWORD` 是否正确
- 对于 Gmail，需要使用应用专用密码，不是普通密码
- 对于 QQ 邮箱，需要使用授权码，不是 QQ 密码
- 对于 163 邮箱，需要使用授权码

#### 2. 连接超时

**错误信息**：`ETIMEDOUT` 或 `Connection timeout`

**解决方案**：

- 检查 `MAIL_HOST` 和 `MAIL_PORT` 是否正确
- 检查网络连接和防火墙设置
- 确认 SMTP 服务器地址和端口是否正确

#### 3. DNS 解析失败

**错误信息**：`ENOTFOUND` 或 `getaddrinfo`

**解决方案**：

- 检查 `MAIL_HOST` 是否正确（应该是完整的 SMTP 服务器地址）
- 检查 DNS 解析是否正常

#### 4. 证书验证失败

**错误信息**：`self signed certificate`

**解决方案**：

- 检查 `MAIL_SECURE` 配置是否正确
- 确认端口和加密设置匹配（587 + false 或 465 + true）

### 获取邮箱授权码

#### Gmail

1. 登录 Google 账户
2. 进入"安全性"设置
3. 启用"两步验证"
4. 生成"应用专用密码"
5. 使用应用专用密码作为 `MAIL_PASSWORD`

#### QQ 邮箱

1. 登录 QQ 邮箱
2. 进入"设置" → "账户"
3. 开启"POP3/SMTP 服务"
4. 生成授权码
5. 使用授权码作为 `MAIL_PASSWORD`

#### 163 邮箱

1. 登录 163 邮箱
2. 进入"设置" → "POP3/SMTP/IMAP"
3. 开启 SMTP 服务
4. 生成授权码
5. 使用授权码作为 `MAIL_PASSWORD`

### 调试技巧

1. **启用详细日志**：检查邮件服务的日志输出
2. **使用测试脚本**：运行 `pnpm test:email` 验证配置
3. **检查环境变量**：确认所有必需的配置都已设置
4. **验证网络连接**：使用 `telnet` 或 `nc` 测试 SMTP 连接

```bash
# 测试 SMTP 连接
telnet smtp.example.com 587
```

## 最佳实践

1. **配置管理**：使用 `@hl8/config` 统一管理配置，避免硬编码
2. **错误处理**：始终使用 try-catch 处理邮件发送异常
3. **日志记录**：邮件服务会自动记录日志，无需手动记录
4. **模板使用**：优先使用库提供的模板，保持邮件风格一致
5. **异步处理**：对于非关键邮件，考虑异步发送
6. **批量发送**：使用 `Promise.allSettled` 处理批量发送
7. **重试机制**：对于重要邮件，实现重试机制
8. **监控告警**：监控邮件发送成功率，设置告警阈值

## 相关资源

- [Nodemailer 文档](https://nodemailer.com/)
- [@nestjs-modules/mailer 文档](https://github.com/nest-modules/mailer)
- [项目规范文档](../../../docs/)
