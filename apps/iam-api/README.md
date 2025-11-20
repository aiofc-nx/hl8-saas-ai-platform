### Backend

## 环境变量配置

应用启动需要以下环境变量，请在项目根目录创建 `.env` 文件：

### 必需的环境变量

```env
# 服务器配置
HOST=localhost
PORT=3000
NODE_ENV=development

# CORS 配置
ALLOW_CORS_URL=http://localhost:3000

# JWT 配置
ACCESS_TOKEN_SECRET=your-access-token-secret-min-10-chars
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-10-chars
REFRESH_TOKEN_EXPIRATION=7d

# 数据库配置（PostgreSQL）
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=aiofix
DB_PASSWORD=aiofix
DB_NAME=hl8-platform
DB_SSL=false

# 邮件服务配置
MAIL_HOST=smtp.example.com
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_PORT=587
MAIL_SECURE=false

# 文件存储配置
FILE_SYSTEM=public
FILE_MAX_SIZE=20971520

# AWS S3 配置（如果使用 S3 存储，否则可以留空）
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_S3_ENDPOINT=
```

### 环境变量说明

- `HOST`: 服务器主机地址
- `PORT`: 服务器端口号
- `NODE_ENV`: 运行环境（development/production/test/provision）
- `ALLOW_CORS_URL`: 允许的 CORS 来源 URL
- `ACCESS_TOKEN_SECRET`: JWT 访问令牌密钥（最少 10 个字符）
- `ACCESS_TOKEN_EXPIRATION`: 访问令牌过期时间（如：15m, 1h）
- `REFRESH_TOKEN_SECRET`: JWT 刷新令牌密钥（最少 10 个字符）
- `REFRESH_TOKEN_EXPIRATION`: 刷新令牌过期时间（如：7d, 30d）
- `DB_HOST`: PostgreSQL 数据库主机地址（默认：localhost）
- `DB_PORT`: PostgreSQL 数据库端口（默认：5432）
- `DB_USERNAME`: PostgreSQL 数据库用户名
- `DB_PASSWORD`: PostgreSQL 数据库密码
- `DB_NAME`: PostgreSQL 数据库名称
- `DB_SSL`: 是否启用 SSL 连接（true/false，默认：false）
- `MAIL_HOST`: SMTP 邮件服务器地址或预定义服务名（如 'gmail', 'outlook'）。如果使用预定义服务名，系统会自动配置连接参数；否则需要提供完整的 SMTP 服务器地址（如 'smtp.gmail.com'）
- `MAIL_USERNAME`: 邮件服务用户名（通常是邮箱地址）
- `MAIL_PASSWORD`: 邮件服务密码或应用专用密码
- `MAIL_PORT`: SMTP 端口号（可选，默认 587）。通常 587 用于 STARTTLS，465 用于 SSL/TLS
- `MAIL_SECURE`: 是否使用安全连接（可选，默认 false）。587 端口通常为 false，465 端口为 true
- `FILE_SYSTEM`: 文件存储系统（'s3' 或 'public'）
- `FILE_MAX_SIZE`: 最大文件大小（字节，默认 20MB）
- `AWS_*`: AWS S3 相关配置（仅在 FILE_SYSTEM=s3 时需要）

## 数据库迁移

### 首次运行

应用启动时会自动运行待处理的数据库迁移（在 `AppModule.onModuleInit()` 中）。

### 手动管理迁移

如果需要手动管理数据库迁移，可以使用以下命令：

```bash
# 创建新的迁移文件
pnpm run migration:create

# 运行所有待处理的迁移
pnpm run migration:up

# 回滚最后一次迁移
pnpm run migration:down

# 查看迁移列表
pnpm run migration:list

# 查看待处理的迁移
pnpm run migration:pending

# 删除所有表并重新运行所有迁移（危险操作，仅用于开发环境）
pnpm run migration:fresh
```

### 迁移文件位置

迁移文件位于 `src/migrations/` 目录，编译后会在 `dist/migrations/` 目录。

### 注意事项

- 生产环境建议手动运行迁移，而不是依赖自动迁移
- 迁移文件会自动生成，但建议检查生成的 SQL 语句
- 确保在运行迁移前备份数据库

## 邮件服务测试

### 快速测试

使用测试脚本验证邮件配置：

```bash
# 发送测试邮件到指定邮箱
pnpm test:email your-email@example.com
```

### 详细配置指南

请参考 [邮件服务配置指南](./docs/EMAIL_CONFIGURATION.md) 获取：

- 常见邮件服务商的详细配置方法（Gmail、Outlook、QQ、163 等）
- 生产环境测试步骤
- 故障排查指南
- 安全建议和最佳实践
