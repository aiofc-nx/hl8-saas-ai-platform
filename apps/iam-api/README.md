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

# 微信开放平台配置（可选，用于微信扫码登录）
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=http://localhost:8000/auth/wechat/callback

# 前端地址（用于微信登录重定向）
FRONTEND_URL=http://localhost:3000
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
- `WECHAT_APP_ID`: 微信开放平台应用 ID（可选，用于微信扫码登录）
- `WECHAT_APP_SECRET`: 微信开放平台应用密钥（可选，用于微信扫码登录）
- `WECHAT_REDIRECT_URI`: 微信授权回调地址（可选，格式：`http://your-domain.com/auth/wechat/callback`）
- `FRONTEND_URL`: 前端应用地址（用于微信登录成功后的重定向）

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

## 测试

### 测试类型

项目包含三种类型的测试：

- **单元测试** (`test:unit`): 测试单个函数和类的功能
- **集成测试** (`test:integration`): 测试模块之间的集成，包括数据库操作
- **端到端测试** (`test:e2e`): 测试完整的 API 端点

### 运行测试

```bash
# 运行所有测试
pnpm test:all

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行端到端测试
pnpm test:e2e

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监视模式运行测试
pnpm test:watch
```

### 集成测试配置

集成测试需要连接到 PostgreSQL 数据库。测试使用以下默认配置（匹配 `docker-compose.yml` 中的配置）：

- **数据库主机**: `localhost` (可通过 `DB_HOST` 环境变量覆盖)
- **数据库端口**: `5432` (可通过 `DB_PORT` 环境变量覆盖)
- **数据库用户名**: `aiofix` (可通过 `DB_USERNAME` 环境变量覆盖)
- **数据库密码**: `aiofix` (可通过 `DB_PASSWORD` 环境变量覆盖)
- **数据库名称**: `test_db` (可通过 `DB_NAME` 环境变量覆盖)

#### 使用 Docker 容器运行测试

如果使用项目中的 `docker-compose.yml` 启动数据库：

1. **启动数据库容器**：

   ```bash
   docker-compose up -d postgres
   ```

2. **创建测试数据库**（在 Docker 容器中）：

   ```bash
   # 方式1：使用 docker exec
   docker exec -it postgres_container psql -U aiofix -d hl8-platform -c "CREATE DATABASE test_db;"

   # 方式2：使用本地 psql 客户端（如果已安装）
   PGPASSWORD=aiofix createdb -h localhost -U aiofix -p 5432 test_db
   ```

3. **运行集成测试**：

   ```bash
   # 使用默认配置（匹配 Docker 容器）
   pnpm test:integration

   # 或者显式指定配置
   DB_USERNAME=aiofix DB_PASSWORD=aiofix DB_NAME=test_db pnpm test:integration
   ```

#### 使用本地 PostgreSQL 运行测试

如果使用本地安装的 PostgreSQL：

1. **确保 PostgreSQL 服务正在运行**
2. **创建测试数据库**（如果不存在）：
   ```bash
   createdb -U postgres test_db
   ```
3. **设置正确的数据库密码环境变量**（如果您的数据库密码不是默认值）：

   ```bash
   # 方式1：在命令前设置环境变量
   DB_USERNAME=postgres DB_PASSWORD=your_password pnpm test:integration

   # 方式2：导出环境变量
   export DB_USERNAME=postgres
   export DB_PASSWORD=your_password
   pnpm test:integration
   ```

#### 测试数据库要求

- 测试数据库应该是一个独立的数据库，不要与开发或生产数据库混用
- 测试会自动创建和清理测试数据，但不会删除数据库本身
- 确保测试数据库用户有足够的权限创建表和执行迁移

#### 常见问题

**问题：数据库认证失败**

```
错误：password authentication failed for user "aiofix"
```

**解决方案**：

1. 确认 PostgreSQL 服务正在运行（Docker 容器或本地服务）
2. 确认数据库用户名和密码正确
   - Docker 容器默认：`aiofix/aiofix`
   - 本地 PostgreSQL 默认：`postgres/postgres`
3. 设置正确的环境变量：

   ```bash
   # Docker 容器
   DB_USERNAME=aiofix DB_PASSWORD=aiofix pnpm test:integration

   # 本地 PostgreSQL
   DB_USERNAME=postgres DB_PASSWORD=your_actual_password pnpm test:integration
   ```

**问题：数据库不存在**

```
错误：database "test_db" does not exist
```

**解决方案**：

对于 Docker 容器：

```bash
docker exec -it postgres_container psql -U aiofix -d hl8-platform -c "CREATE DATABASE test_db;"
# 或
PGPASSWORD=aiofix createdb -h localhost -U aiofix -p 5432 test_db
```

对于本地 PostgreSQL：

```bash
createdb -U postgres test_db
# 或使用其他用户
createdb -U your_username test_db
```

**问题：权限不足**

```
错误：permission denied to create database
```

**解决方案**：
确保数据库用户有创建数据库和表的权限，或者使用具有足够权限的用户（如 `postgres` 超级用户）。
