# 完整认证流程文档

## 📋 概述

本文档描述了完整的用户认证流程，包括邮箱注册、邮箱验证和微信绑定。

## 🔄 完整认证流程

### 阶段 1：用户注册

**步骤 1：用户注册（邮箱+密码）**

```http
POST /auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**响应**：

```json
{
  "message": "User registered successfully"
}
```

**说明**：

- 注册成功后，系统自动生成邮箱验证码（OTP）
- 验证码通过邮件发送到用户邮箱
- 用户处于未验证状态（`isEmailVerified: false`）

---

### 阶段 2：邮箱验证

**步骤 2：用户输入验证码**

```http
PATCH /auth/confirm-email
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "123456"
}
```

**响应**：

```json
{
  "message": "Email confirmed successfully. You are now logged in.",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "user",
    "isEmailVerified": true,
    "emailVerifiedAt": "2024-01-01T00:00:00.000Z",
    "profile": {
      "name": "user",
      ...
    }
  },
  "tokens": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "session_token": "session-uuid",
    "session_refresh_time": "2024-01-01T01:00:00.000Z"
  }
}
```

**说明**：

- ✅ 验证成功后，自动生成 JWT 令牌
- ✅ 用户自动登录，前端可以保存令牌
- ✅ 前端可以重定向到绑定微信页面

**前端处理**：

```typescript
// 保存令牌
localStorage.setItem('access_token', response.tokens.access_token);
localStorage.setItem('refresh_token', response.tokens.refresh_token);

// 重定向到绑定微信页面
window.location.href = '/auth/bind-wechat';
```

---

### 阶段 3：绑定微信

**步骤 3：已登录用户请求绑定微信二维码**

```http
GET /auth/wechat/bind-qrcode
Authorization: Bearer <access_token>
```

**响应**：

```json
{
  "ticket": "ticket-uuid",
  "qrcodeUrl": "https://open.weixin.qq.com/connect/qrconnect?...",
  "expiresIn": 300
}
```

**说明**：

- 需要用户已登录（通过 JWT 认证）
- 生成绑定专用的二维码
- 二维码有效期 5 分钟

**步骤 4：前端展示二维码并轮询状态**

```typescript
// 1. 显示二维码
<QRCode value={qrcodeUrl} size={256} />

// 2. 轮询状态（每 2 秒）
const interval = setInterval(async () => {
  const response = await fetch(`/api/auth/wechat/status?ticket=${ticket}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();

  if (data.status === 'success') {
    clearInterval(interval);
    // 绑定成功
    alert('微信绑定成功！');
    window.location.href = '/dashboard';
  } else if (data.status === 'failed') {
    clearInterval(interval);
    // 绑定失败
    alert('绑定失败：' + data.error);
  }
}, 2000);
```

**步骤 5：用户扫码并确认**

1. 用户使用微信扫描二维码
2. 在微信中确认授权
3. 微信回调到后端
4. 后端绑定微信账号到当前登录用户
5. 状态更新为 `success`

**步骤 6：前端获取绑定结果**

```http
GET /auth/wechat/status?ticket=ticket-uuid
```

**响应（绑定成功）**：

```json
{
  "status": "success",
  "ticket": "ticket-uuid",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "wechatOpenid": "wechat-openid",
      ...
    },
    "tokens": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

---

## 🔄 后续使用流程

### 已绑定微信用户登录

**方式 1：邮箱+密码登录**

```http
POST /auth/sign-in
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "securePassword123"
}
```

**方式 2：微信扫码登录**

1. 获取登录二维码：`GET /auth/wechat/qrcode`
2. 显示二维码
3. 用户扫码
4. 轮询状态：`GET /auth/wechat/status?ticket=xxx`
5. 获取登录结果和令牌

**说明**：

- 如果微信账号已绑定用户，直接使用已绑定的用户登录
- 如果微信账号未绑定，可以选择创建新用户（独立登录模式）

---

## 📝 API 端点汇总

### 用户注册与验证

| 端点                              | 方法  | 说明                 | 认证 |
| --------------------------------- | ----- | -------------------- | ---- |
| `/auth/sign-up`                   | POST  | 用户注册             | ❌   |
| `/auth/confirm-email`             | PATCH | 邮箱验证（自动登录） | ❌   |
| `/auth/resend-confirmation-email` | POST  | 重发验证码邮件       | ❌   |

### 微信登录

| 端点                       | 方法 | 说明                 | 认证 |
| -------------------------- | ---- | -------------------- | ---- |
| `/auth/wechat/qrcode`      | GET  | 生成登录二维码       | ❌   |
| `/auth/wechat/bind-qrcode` | GET  | 生成绑定二维码       | ✅   |
| `/auth/wechat/callback`    | GET  | 微信回调（自动处理） | ❌   |
| `/auth/wechat/status`      | GET  | 查询登录/绑定状态    | ❌   |

### 用户登录

| 端点                  | 方法  | 说明          | 认证 |
| --------------------- | ----- | ------------- | ---- |
| `/auth/sign-in`       | POST  | 邮箱+密码登录 | ❌   |
| `/auth/refresh-token` | PATCH | 刷新令牌      | ✅   |
| `/auth/sign-out`      | POST  | 登出          | ✅   |

---

## 🔒 安全考虑

1. **邮箱验证码有效期**：24 小时
2. **二维码有效期**：5 分钟
3. **令牌有效期**：根据配置（默认 access_token 1 小时，refresh_token 7 天）
4. **绑定验证**：
   - 只能绑定未绑定其他用户的微信账号
   - 只能绑定到当前登录的用户
5. **重复绑定检查**：
   - 如果用户已绑定微信，无法再次绑定
   - 如果微信账号已绑定其他用户，无法绑定

---

## 📱 前端实现示例

### React 完整示例

```typescript
import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

function CompleteAuthFlow() {
  const [step, setStep] = useState<'register' | 'verify' | 'bind'>('register');
  const [ticket, setTicket] = useState<string | null>(null);
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  // 步骤 1：注册
  const handleRegister = async (email: string, password: string) => {
    await fetch('/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setStep('verify');
  };

  // 步骤 2：验证邮箱
  const handleVerifyEmail = async (email: string, code: string) => {
    const response = await fetch('/api/auth/confirm-email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token: code }),
    });
    const data = await response.json();

    // 保存令牌
    localStorage.setItem('access_token', data.tokens.access_token);
    localStorage.setItem('refresh_token', data.tokens.refresh_token);

    // 跳转到绑定微信
    setStep('bind');
    loadBindQrcode();
  };

  // 步骤 3：加载绑定二维码
  const loadBindQrcode = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/auth/wechat/bind-qrcode', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setTicket(data.ticket);
    setQrcodeUrl(data.qrcodeUrl);
  };

  // 步骤 4：轮询状态
  useEffect(() => {
    if (!ticket || step !== 'bind') return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/auth/wechat/status?ticket=${ticket}`);
      const data = await response.json();

      if (data.status === 'success') {
        setStatus('success');
        clearInterval(interval);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else if (data.status === 'failed') {
        setStatus('failed');
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [ticket, step]);

  return (
    <div className="auth-flow">
      {step === 'register' && <RegisterForm onSubmit={handleRegister} />}
      {step === 'verify' && <VerifyEmailForm onSubmit={handleVerifyEmail} />}
      {step === 'bind' && (
        <div>
          {qrcodeUrl && <QRCode value={qrcodeUrl} size={256} />}
          {status === 'success' && <p>绑定成功！</p>}
          {status === 'failed' && <p>绑定失败，请重试</p>}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ 流程检查清单

- [x] 用户注册（邮箱+密码）
- [x] 邮箱验证（发送验证码）
- [x] 邮箱验证后自动登录（返回 JWT）
- [x] 绑定微信二维码生成（需要登录）
- [x] 微信绑定流程（绑定到已登录用户）
- [x] 微信登录流程（支持已绑定用户）
- [x] 状态轮询机制

---

## 📚 相关文档

- [认证与授权机制](../AUTHENTICATION_AND_AUTHORIZATION.md)
- [微信登录实现](../wechat/README.md)
- [认证流程分析](./AUTH_FLOW_ANALYSIS.md)
