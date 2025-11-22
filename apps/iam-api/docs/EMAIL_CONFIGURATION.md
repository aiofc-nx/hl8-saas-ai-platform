# 邮件服务配置指南

本文档提供详细的邮件服务配置说明，包括常见邮件服务商的配置方法和生产环境测试步骤。

## 目录

- [快速开始](#快速开始)
- [常见邮件服务商配置](#常见邮件服务商配置)
- [生产环境测试](#生产环境测试)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

## 快速开始

### 1. 配置环境变量

在项目根目录的 `.env` 文件中配置邮件相关环境变量：

```env
# 邮件服务配置
MAIL_HOST=smtp.example.com
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_PORT=587
MAIL_SECURE=false
```

### 2. 测试邮件发送

使用测试脚本验证配置：

```bash
# 发送测试邮件到指定邮箱
pnpm test:email test@example.com
```

## 常见邮件服务商配置

### Gmail

#### 方法一：使用预定义服务名（推荐）

```env
MAIL_HOST=gmail
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # 必须使用应用专用密码
MAIL_PORT=587
MAIL_SECURE=false
```

#### 方法二：使用完整 SMTP 配置

```env
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # 必须使用应用专用密码
MAIL_PORT=587
MAIL_SECURE=false
```

**重要提示：**

- Gmail 需要使用**应用专用密码**，不能使用普通密码
- 生成应用专用密码：Google 账户 → 安全性 → 两步验证 → 应用专用密码
- 如果启用了两步验证，必须使用应用专用密码
- 如果未启用两步验证，需要启用"允许不够安全的应用"

### Outlook / Microsoft 365

#### 方法一：使用预定义服务名

```env
MAIL_HOST=outlook
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_PORT=587
MAIL_SECURE=false
```

#### 方法二：使用完整 SMTP 配置

```env
MAIL_HOST=smtp-mail.outlook.com
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_PORT=587
MAIL_SECURE=false
```

**Microsoft 365 企业邮箱：**

```env
MAIL_HOST=smtp.office365.com
MAIL_USERNAME=your-email@yourcompany.com
MAIL_PASSWORD=your-password
MAIL_PORT=587
MAIL_SECURE=false
```

### QQ 邮箱

**推荐配置（使用 465 端口 SSL）：**

```env
MAIL_HOST=smtp.qq.com
MAIL_USERNAME=your-email@qq.com
MAIL_PASSWORD=your-authorization-code  # 必须使用授权码，不是QQ密码
MAIL_PORT=465
MAIL_SECURE=true
```

**备选配置（使用 587 端口 STARTTLS，可能在某些环境下不稳定）：**

```env
MAIL_HOST=smtp.qq.com
MAIL_USERNAME=your-email@qq.com
MAIL_PASSWORD=your-authorization-code  # 必须使用授权码，不是QQ密码
MAIL_PORT=587
MAIL_SECURE=false
```

**注意：** 如果使用 587 端口遇到 SSL 版本错误，请改用 465 端口（SSL）。

**获取授权码：**

1. 登录 QQ 邮箱
2. 设置 → 账户
3. 开启 POP3/SMTP 服务
4. 生成授权码

### 163 邮箱

```env
MAIL_HOST=smtp.163.com
MAIL_USERNAME=your-email@163.com
MAIL_PASSWORD=your-authorization-code  # 必须使用授权码
MAIL_PORT=465
MAIL_SECURE=true
```

**获取授权码：**

1. 登录 163 邮箱
2. 设置 → POP3/SMTP/IMAP
3. 开启 SMTP 服务
4. 生成授权码

### 126 邮箱

```env
MAIL_HOST=smtp.126.com
MAIL_USERNAME=your-email@126.com
MAIL_PASSWORD=your-authorization-code  # 必须使用授权码
MAIL_PORT=465
MAIL_SECURE=true
```

### 企业邮箱（自定义 SMTP）

```env
MAIL_HOST=smtp.yourcompany.com
MAIL_USERNAME=your-email@yourcompany.com
MAIL_PASSWORD=your-password
MAIL_PORT=587
MAIL_SECURE=false
```

**常见端口配置：**

- **587**: STARTTLS（推荐，大多数服务商支持）
- **465**: SSL/TLS（需要设置 `MAIL_SECURE=true`）
- **25**: 不加密（不推荐，很多服务商已禁用）

## 生产环境测试

### 步骤 1：配置环境变量

确保生产环境的 `.env` 文件包含正确的邮件配置：

```env
NODE_ENV=production
MAIL_HOST=smtp.example.com
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_PORT=587
MAIL_SECURE=false
```

### 步骤 2：运行测试脚本

```bash
# 在项目根目录执行
cd apps/fastify-api

# 发送测试邮件
pnpm test:email your-test-email@example.com
```

### 步骤 3：验证邮件接收

1. 检查收件箱（包括垃圾邮件文件夹）
2. 确认邮件内容正确显示
3. 检查发件人地址是否正确

### 步骤 4：测试实际功能

测试应用中的邮件发送功能：

1. **用户注册邮件**
   - 注册新用户
   - 检查是否收到注册确认邮件

2. **密码重置邮件**
   - 请求密码重置
   - 检查是否收到重置链接

3. **登录通知邮件**
   - 登录账户
   - 检查是否收到登录通知

## 故障排查

### 常见错误及解决方案

#### 1. 认证失败 (Authentication failed)

**错误信息：**

```
Error: Invalid login: 535 Authentication failed
```

**解决方案：**

- 检查 `MAIL_USERNAME` 和 `MAIL_PASSWORD` 是否正确
- Gmail/QQ/163 等需要使用应用专用密码或授权码，不能使用普通密码
- 确认邮箱账户未被锁定或限制

#### 2. 连接超时 (Connection timeout)

**错误信息：**

```
Error: Connection timeout
Error: ETIMEDOUT
```

**解决方案：**

- 检查 `MAIL_HOST` 和 `MAIL_PORT` 是否正确
- 检查网络连接和防火墙设置
- 确认 SMTP 服务器地址可访问

#### 3. DNS 解析失败 (ENOTFOUND)

**错误信息：**

```
Error: getaddrinfo ENOTFOUND smtp.example.com
```

**解决方案：**

- 检查 `MAIL_HOST` 是否正确（应该是完整的 SMTP 服务器地址）
- 检查 DNS 解析是否正常
- 尝试使用 IP 地址（不推荐）

#### 4. SSL/TLS 错误

**错误信息：**

```
Error: self signed certificate
Error: UNABLE_TO_VERIFY_LEAF_SIGNATURE
```

**解决方案：**

- 检查 `MAIL_SECURE` 配置是否正确
- 确认端口和加密设置匹配（587 + false 或 465 + true）
- 某些企业邮箱可能需要特殊证书配置

#### 5. 邮件被拒绝 (Message rejected)

**错误信息：**

```
Error: Message rejected
```

**解决方案：**

- 检查发件人地址格式是否正确
- 确认邮箱账户有发送权限
- 检查是否触发了反垃圾邮件策略

### 调试技巧

1. **启用详细日志**
   - 检查应用日志中的邮件发送记录
   - 查看错误堆栈信息

2. **使用测试脚本**
   - 使用 `pnpm test:email` 脚本单独测试邮件配置
   - 逐步验证每个配置项

3. **检查网络连接**

   ```bash
   # 测试 SMTP 服务器连接
   telnet smtp.gmail.com 587
   ```

4. **验证环境变量**
   ```bash
   # 检查环境变量是否正确加载
   node -e "require('dotenv').config(); console.log(process.env.MAIL_HOST)"
   ```

## 安全建议

### 1. 密码安全

- ✅ **使用应用专用密码**：Gmail、QQ、163 等应使用应用专用密码或授权码
- ✅ **环境变量存储**：密码应存储在环境变量中，不要硬编码
- ✅ **定期更换密码**：定期更新邮件服务密码
- ❌ **不要提交密码**：确保 `.env` 文件在 `.gitignore` 中

### 2. 生产环境配置

- ✅ **使用专用邮箱**：为应用创建专用的发送邮箱
- ✅ **限制发送频率**：实现速率限制，避免被标记为垃圾邮件
- ✅ **监控发送状态**：记录邮件发送日志，监控失败率
- ✅ **错误处理**：实现完善的错误处理和重试机制

### 3. 反垃圾邮件策略

- ✅ **SPF 记录**：配置域名的 SPF 记录
- ✅ **DKIM 签名**：启用 DKIM 邮件签名
- ✅ **DMARC 策略**：配置 DMARC 策略
- ✅ **发件人地址**：使用真实、可验证的发件人地址

### 4. 监控和告警

- ✅ **发送成功率监控**：监控邮件发送成功率
- ✅ **错误告警**：设置邮件发送失败告警
- ✅ **日志记录**：记录所有邮件发送操作

## 预定义服务名

系统支持以下预定义服务名，使用这些服务名时系统会自动配置连接参数：

- `gmail` - Gmail
- `outlook` - Outlook / Hotmail
- `yahoo` - Yahoo Mail
- `hotmail` - Hotmail
- `qq` - QQ 邮箱
- `163` - 163 邮箱
- `126` - 126 邮箱
- `sina` - 新浪邮箱
- `sohu` - 搜狐邮箱

使用预定义服务名时，只需设置 `MAIL_HOST` 为服务名，系统会自动处理其他配置。

## 相关文档

- [README.md](../README.md) - 项目主文档
- [环境变量配置](../README.md#环境变量配置) - 环境变量详细说明
