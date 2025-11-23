# 快速开始指南

本指南帮助您快速集成和使用 `@hl8/mail` 邮件服务模块。

## 5 分钟快速集成

### 步骤 1: 安装依赖

```bash
pnpm add @hl8/mail
```

### 步骤 2: 配置环境变量

在项目根目录的 `.env` 文件中添加：

```env
MAIL_HOST=smtp.example.com
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-password
MAIL_PORT=587
MAIL_SECURE=false
```

### 步骤 3: 配置 MailerModule

创建或更新 `NodeMailerModule`：

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

### 步骤 4: 导入 MailModule

在 `AppModule` 中导入：

```typescript
import { Module } from '@nestjs/common';
import { MailModule } from '@hl8/mail';
import { EnvConfig } from './common/utils/validateEnv';

@Module({
  imports: [
    NodeMailerModule,
    MailModule.forRoot(EnvConfig),
    // ... 其他模块
  ],
})
export class AppModule {}
```

### 步骤 5: 使用邮件服务

在服务中注入并使用：

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '@hl8/mail';

@Injectable()
export class UserService {
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

## 使用邮件模板

```typescript
import { MailService, RegisterSuccessMail } from '@hl8/mail';

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
}
```

## 测试邮件配置

```bash
cd libs/mail
pnpm test:email your-email@example.com
```

## 常见邮箱配置示例

### Gmail

```env
MAIL_HOST=gmail
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_PORT=587
MAIL_SECURE=false
```

### QQ 邮箱

```env
MAIL_HOST=qq
MAIL_USERNAME=your-email@qq.com
MAIL_PASSWORD=your-authorization-code
MAIL_PORT=587
MAIL_SECURE=false
```

### 163 邮箱

```env
MAIL_HOST=163
MAIL_USERNAME=your-email@163.com
MAIL_PASSWORD=your-authorization-code
MAIL_PORT=587
MAIL_SECURE=false
```

### 自定义 SMTP 服务器

```env
MAIL_HOST=smtp.example.com
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-password
MAIL_PORT=587
MAIL_SECURE=false
```

## 下一步

- 查看 [完整使用指南](./USAGE_GUIDE.md) 了解更多功能和最佳实践
- 查看 [README.md](../README.md) 了解完整的 API 参考和功能说明
- 查看 [邮件模板列表](../README.md#邮件模板) 使用内置模板

## 需要帮助？

如果遇到问题，请查看 [使用指南](./USAGE_GUIDE.md) 中的 [故障排查](./USAGE_GUIDE.md#故障排查) 部分。
