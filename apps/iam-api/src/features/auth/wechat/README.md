# 微信扫码登录实现

## 📋 概述

微信扫码登录功能已实现，支持 OAuth2 授权码流程，允许用户使用微信账号登录系统。

---

## ✅ 已实现的功能

1. ✅ 生成微信登录二维码
2. ✅ 处理微信授权回调
3. ✅ 获取微信用户信息
4. ✅ 自动创建或绑定用户
5. ✅ 生成 JWT 令牌
6. ✅ 创建会话记录
7. ✅ 前端轮询查询登录状态

---

## 🚀 快速开始

### 1. 配置环境变量

在 `.env` 文件中添加以下配置：

```env
# 微信开放平台配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=http://your-domain.com/auth/wechat/callback
FRONTEND_URL=http://localhost:3000
```

### 2. 创建数据库迁移

需要创建数据库迁移添加以下内容：

- `WechatLoginTicket` 表
- `User` 表的 `wechat_openid` 字段

运行迁移：

```bash
pnpm --filter iam-api migration:create
pnpm --filter iam-api migration:up
```

### 3. API 端点

#### 生成二维码

```http
GET /auth/wechat/qrcode
```

**响应**：

```json
{
  "ticket": "uuid-here",
  "qrcodeUrl": "https://open.weixin.qq.com/...",
  "expiresIn": 300
}
```

#### 查询登录状态

```http
GET /auth/wechat/status?ticket=uuid-here
```

**响应（未扫描）**：

```json
{
  "status": "pending",
  "ticket": "uuid-here"
}
```

**响应（登录成功）**：

```json
{
  "status": "success",
  "ticket": "uuid-here",
  "data": {
    "user": { ... },
    "tokens": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

#### 微信回调（自动处理）

```http
GET /auth/wechat/callback?code=xxx&state=ticket-uuid
```

---

## 📱 前端实现示例

### React 示例

```typescript
import { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';

function WechatLogin() {
  const [ticket, setTicket] = useState<string | null>(null);
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  // 1. 生成二维码
  useEffect(() => {
    fetch('/api/auth/wechat/qrcode')
      .then((res) => res.json())
      .then((data) => {
        setTicket(data.ticket);
        setQrcodeUrl(data.qrcodeUrl);
      });
  }, []);

  // 2. 轮询检查状态
  useEffect(() => {
    if (!ticket) return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/auth/wechat/status?ticket=${ticket}`);
      const data = await response.json();

      if (data.status === 'success') {
        setStatus('success');
        clearInterval(interval);
        // 保存令牌
        localStorage.setItem('access_token', data.data.tokens.access_token);
        localStorage.setItem('refresh_token', data.data.tokens.refresh_token);
        // 跳转到首页
        window.location.href = '/';
      } else if (data.status === 'failed') {
        setStatus('failed');
        clearInterval(interval);
      }
    }, 2000); // 每 2 秒轮询一次

    return () => clearInterval(interval);
  }, [ticket]);

  return (
    <div className="wechat-login">
      {qrcodeUrl && (
        <>
          <QRCode value={qrcodeUrl} size={256} />
          <p>请使用微信扫描二维码</p>
        </>
      )}
      {status === 'success' && <p>登录成功！</p>}
      {status === 'failed' && <p>登录失败，请重试</p>}
    </div>
  );
}
```

---

## 📝 数据库迁移

### 添加 `wechat_openid` 字段到 `User` 表

```sql
ALTER TABLE "user" ADD COLUMN "wechat_openid" VARCHAR(255) NULL;
CREATE UNIQUE INDEX "user_wechat_openid_unique" ON "user" ("wechat_openid");
```

### 创建 `wechat_login_ticket` 表

```sql
CREATE TABLE "wechat_login_ticket" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket" VARCHAR(255) NOT NULL UNIQUE,
  "code" VARCHAR(255) NULL,
  "openid" VARCHAR(255) NULL UNIQUE,
  "user_info" JSONB NULL,
  "user_id" UUID NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
  "error" TEXT NULL,
  "tokens" JSONB NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wechat_login_ticket_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL
);

CREATE INDEX "wechat_login_ticket_ticket_index" ON "wechat_login_ticket" ("ticket");
CREATE INDEX "wechat_login_ticket_openid_index" ON "wechat_login_ticket" ("openid");
CREATE INDEX "wechat_login_ticket_status_index" ON "wechat_login_ticket" ("status");
```

---

## 🔧 配置说明

### 微信开放平台配置

1. 注册微信开放平台账号：https://open.weixin.qq.com/
2. 创建网站应用，获取 `AppID` 和 `AppSecret`
3. 配置授权回调域名（不需要协议，如：`your-domain.com`）

### 回调地址配置

回调地址格式：`http://your-domain.com/auth/wechat/callback`

确保：

- ✅ 域名可访问
- ✅ 使用 HTTPS（生产环境）
- ✅ 与配置的回调域名一致

---

## 🔄 登录流程

### 独立登录模式（未登录用户）

1. **前端请求二维码**
   - `GET /auth/wechat/qrcode`
   - 返回 `ticket` 和 `qrcodeUrl`

2. **前端展示二维码**
   - 使用 `qrcodeUrl` 生成二维码
   - 开始轮询状态

3. **用户扫码授权**
   - 用户在微信中扫码
   - 确认授权

4. **微信回调**
   - 微信重定向到 `/auth/wechat/callback`
   - 携带 `code` 和 `state`（ticket）

5. **后端处理**
   - 验证 ticket
   - 使用 code 换取 access_token
   - 获取用户信息
   - 检查微信账号是否已绑定用户
   - 如果已绑定 → 直接登录
   - 如果未绑定 → 创建新用户
   - 生成 JWT 令牌
   - 更新 ticket 状态

6. **前端获取结果**
   - 轮询 `/auth/wechat/status`
   - 获取登录结果和令牌

---

### 绑定模式（已登录用户）

1. **已登录用户请求绑定二维码**
   - `GET /auth/wechat/bind-qrcode`（需要 JWT 认证）
   - 返回 `ticket` 和 `qrcodeUrl`
   - ticket 中包含当前用户 ID

2. **前端展示二维码**
   - 使用 `qrcodeUrl` 生成二维码
   - 开始轮询状态

3. **用户扫码授权**
   - 用户在微信中扫码
   - 确认授权

4. **微信回调**
   - 微信重定向到 `/auth/wechat/callback`
   - 携带 `code` 和 `state`（ticket）

5. **后端处理**
   - 验证 ticket
   - 检查 ticket 是否有 userId（绑定模式）
   - 如果 userId 存在：
     - 检查微信账号是否已被其他用户绑定
     - 绑定微信账号到指定用户
   - 生成 JWT 令牌
   - 更新 ticket 状态

6. **前端获取结果**
   - 轮询 `/auth/wechat/status`
   - 获取绑定结果

---

## 📱 完整认证流程

### 新用户注册 → 邮箱验证 → 绑定微信

详细流程请参考：[完整认证流程文档](../../../docs/COMPLETE_AUTH_FLOW.md)

---

## 🛠️ 扩展功能

### 绑定现有账号

```typescript
// 在 AuthController 中添加
@Post('wechat/bind')
@UseGuards(JwtAuthGuard)
async bindWechat(
  @User() user: User,
  @Body() dto: BindWechatDto,
) {
  // 绑定微信账号逻辑
}
```

### 解绑微信账号

```typescript
@Post('wechat/unbind')
@UseGuards(JwtAuthGuard)
async unbindWechat(@User() user: User) {
  // 解绑微信账号逻辑
}
```

---

## 📚 更多文档

详细实现文档请查看：

- [WECHAT_LOGIN_IMPLEMENTATION.md](../../../../../libs/auth/docs/WECHAT_LOGIN_IMPLEMENTATION.md)
