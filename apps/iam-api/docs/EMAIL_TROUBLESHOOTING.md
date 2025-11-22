# 邮件发送问题诊断指南

## 问题描述

注册成功后跳转到邮件验证页面，但没有收到邮件。

## 可能的原因

### 1. QQ 邮箱授权码问题（最常见）

**问题**：QQ 邮箱需要使用**授权码**而不是 QQ 密码。

**解决方案**：

1. 登录 QQ 邮箱
2. 进入 **设置** → **账户**
3. 找到 **POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务**
4. 开启 **POP3/SMTP服务**
5. 点击 **生成授权码**
6. 将生成的授权码（16位字符）设置为 `MAIL_PASSWORD` 环境变量

**验证**：

```bash
# 检查环境变量
grep MAIL_PASSWORD apps/iam-api/.env
```

### 2. 邮件配置错误

**检查项**：

- `MAIL_HOST` 是否正确（QQ邮箱应为 `smtp.qq.com`）
- `MAIL_USERNAME` 是否为完整的邮箱地址（如 `1296032384@qq.com`）
- `MAIL_PASSWORD` 是否为授权码（不是QQ密码）
- `MAIL_PORT` 是否正确（QQ邮箱应为 `587`）
- `MAIL_SECURE` 是否正确（QQ邮箱应为 `false`）

**验证配置**：

```bash
cd apps/iam-api
cat .env | grep MAIL_
```

### 3. 网络连接问题

**检查项**：

- 服务器是否能访问 SMTP 服务器
- 防火墙是否阻止了 587 端口
- DNS 解析是否正常

**测试连接**：

```bash
# 测试 SMTP 服务器连接
telnet smtp.qq.com 587
```

### 4. 邮件被标记为垃圾邮件

**检查项**：

- 检查收件箱的**垃圾邮件**文件夹
- 检查**已删除邮件**文件夹
- 检查邮件过滤规则

### 5. 邮件服务未正确初始化

**检查项**：

- 应用启动日志中是否有邮件服务初始化错误
- `MailModule` 是否正确导入
- 环境变量是否正确加载

## 诊断步骤

### 步骤 1：检查应用日志

查看应用启动和运行日志，查找以下错误信息：

```bash
# 查看最近的日志
tail -f logs/app.log | grep -i mail

# 或查看控制台输出
# 查找 "Failed to send registration email" 或 "邮件服务配置错误"
```

**常见错误信息**：

- `Authentication failed` - 认证失败，通常是授权码错误
- `Connection timeout` - 连接超时，检查网络和防火墙
- `ENOTFOUND` - DNS 解析失败，检查 MAIL_HOST
- `self signed certificate` - SSL 证书问题，检查 MAIL_SECURE

### 步骤 2：测试邮件发送功能

使用测试脚本验证邮件配置：

```bash
cd apps/iam-api

# 测试发送邮件到指定邮箱
pnpm test:email your-email@example.com
```

**预期结果**：

- ✅ 如果成功：会显示 "✅ 邮件发送成功！"
- ❌ 如果失败：会显示详细的错误信息和解决方案

### 步骤 3：验证环境变量

确保环境变量正确设置：

```bash
cd apps/iam-api

# 检查环境变量（隐藏密码）
cat .env | grep MAIL_ | sed 's/PASSWORD=.*/PASSWORD=***/'
```

**正确的 QQ 邮箱配置示例**：

```env
MAIL_HOST=smtp.qq.com
MAIL_USERNAME=1296032384@qq.com
MAIL_PASSWORD=abcdefghijklmnop  # 16位授权码，不是QQ密码
MAIL_PORT=587
MAIL_SECURE=false
```

### 步骤 4：检查邮件服务配置

确认 `MailModule` 在 `AppModule` 中正确导入：

```typescript
// apps/iam-api/src/app.module.ts
import { MailModule } from '@hl8/mail';

@Module({
  imports: [
    // ...
    MailModule.forRoot(EnvConfig),
    // ...
  ],
})
```

### 步骤 5：手动测试 SMTP 连接

使用命令行工具测试 SMTP 连接：

```bash
# 测试 SMTP 连接（需要安装 telnet）
telnet smtp.qq.com 587

# 如果连接成功，会看到类似以下输出：
# Trying 14.17.57.217...
# Connected to smtp.qq.com.
# Escape character is '^]'.
# 220 smtp.qq.com ESMTP
```

## 解决方案

### 方案 1：更新 QQ 邮箱授权码

1. 登录 QQ 邮箱
2. 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务
3. 开启 POP3/SMTP 服务
4. 生成新的授权码
5. 更新 `.env` 文件中的 `MAIL_PASSWORD`
6. 重启应用

### 方案 2：检查邮件配置

确保 `.env` 文件中的配置正确：

```env
# QQ 邮箱配置
MAIL_HOST=smtp.qq.com
MAIL_USERNAME=your-email@qq.com
MAIL_PASSWORD=your-authorization-code  # 授权码，不是密码
MAIL_PORT=587
MAIL_SECURE=false
```

### 方案 3：查看详细错误日志

改进后的代码会在日志中记录详细的错误信息：

```typescript
// 查看应用日志，查找以下信息：
// - "Failed to send registration email"
// - "邮件服务配置错误"
// - "邮件服务器连接失败"
```

### 方案 4：使用其他邮件服务

如果 QQ 邮箱持续有问题，可以考虑使用其他邮件服务：

**Gmail**：

```env
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # 应用专用密码
MAIL_PORT=587
MAIL_SECURE=false
```

**163 邮箱**：

```env
MAIL_HOST=smtp.163.com
MAIL_USERNAME=your-email@163.com
MAIL_PASSWORD=your-authorization-code  # 授权码
MAIL_PORT=465
MAIL_SECURE=true
```

## 预防措施

### 1. 定期检查邮件服务状态

```bash
# 定期运行测试脚本
pnpm test:email admin@example.com
```

### 2. 监控邮件发送日志

设置日志监控，及时发现邮件发送失败：

```bash
# 监控邮件发送错误
tail -f logs/app.log | grep -i "failed to send\|邮件发送失败"
```

### 3. 使用邮件队列

对于生产环境，建议使用邮件队列服务（如 Redis Queue），避免同步发送邮件阻塞请求。

## 相关文档

- [邮件配置指南](./EMAIL_CONFIGURATION.md) - 详细的邮件服务配置说明
- [环境变量配置](../README.md#环境变量配置) - 环境变量详细说明

## 获取帮助

如果以上步骤都无法解决问题，请：

1. 收集应用日志（包含邮件发送错误信息）
2. 运行测试脚本并记录输出
3. 检查环境变量配置（隐藏敏感信息）
4. 联系技术支持
