# 前端与后端 API 匹配对比文档

## 概述

本文档对比前端 `apps/web` 与后端 `apps/iam-api` 的 API 端点匹配情况。

**后端基础 URL**: 根据环境配置（默认应运行在某个端口）
**前端 API URL**: `env.API_URL`（默认 `http://localhost:8000`）

---

## ✅ 已匹配的端点

### 1. 用户认证端点

| 端点                        | 方法 | 前端调用                                      | 后端实现                           | 状态 |
| --------------------------- | ---- | --------------------------------------------- | ---------------------------------- | ---- |
| `/auth/sign-up`             | POST | `signUpWithCredentials`                       | `AuthController.register`          | ✅   |
| `/auth/sign-in`             | POST | `authorizeSignIn`<br/>`signInWithCredentials` | `AuthController.signIn`            | ✅   |
| `/auth/sign-out`            | POST | `signOutCurrentDevice`                        | `AuthController.signOut`           | ✅   |
| `/auth/sign-out-allDevices` | POST | `signOutAllDevice`                            | `AuthController.signOutAllDevices` | ✅   |

### 2. 会话管理端点

| 端点                     | 方法 | 前端调用          | 后端实现                  | 状态 |
| ------------------------ | ---- | ----------------- | ------------------------- | ---- |
| `/auth/sessions/:userId` | GET  | `getAuthSessions` | `AuthController.sessions` | ✅   |
| `/auth/session/:id`      | GET  | `getSessionById`  | `AuthController.session`  | ✅   |

### 3. 邮箱验证端点

| 端点                              | 方法  | 前端调用                  | 后端实现                                 | 状态 |
| --------------------------------- | ----- | ------------------------- | ---------------------------------------- | ---- |
| `/auth/confirm-email`             | PATCH | `confirmEmail`            | `AuthController.confirmEmail`            | ✅   |
| `/auth/resend-confirmation-email` | POST  | `resendConfirmationEmail` | `AuthController.resendConfirmationEmail` | ✅   |

### 4. 密码管理端点

| 端点                    | 方法  | 前端调用         | 后端实现                        | 状态 |
| ----------------------- | ----- | ---------------- | ------------------------------- | ---- |
| `/auth/forgot-password` | PATCH | `forgotPassword` | `AuthController.forgotPassword` | ✅   |
| `/auth/reset-password`  | PATCH | `resetPassword`  | `AuthController.resetPassword`  | ✅   |
| `/auth/change-password` | PATCH | `changePassword` | `AuthController.changePassword` | ✅   |

### 5. 令牌管理端点

| 端点                  | 方法  | 前端调用             | 后端实现                      | 状态 |
| --------------------- | ----- | -------------------- | ----------------------------- | ---- |
| `/auth/refresh-token` | PATCH | `refreshAccessToken` | `AuthController.refreshToken` | ✅   |

### 6. 账户管理端点

| 端点                   | 方法   | 前端调用        | 后端实现                    | 状态 |
| ---------------------- | ------ | --------------- | --------------------------- | ---- |
| `/auth/delete-account` | DELETE | `deleteAccount` | `AuthController.deleteUser` | ✅   |

---

## ❌ 未匹配的端点（后端有，前端无）

### 微信认证端点

后端已实现微信扫码登录功能，但前端**尚未实现**对应的调用：

| 端点                       | 方法 | 后端实现                                  | 前端实现                    | 状态 |
| -------------------------- | ---- | ----------------------------------------- | --------------------------- | ---- |
| `/auth/wechat/qrcode`      | GET  | `WechatAuthController.generateQrcode`     | ❌ 未实现                   | ⚠️   |
| `/auth/wechat/callback`    | GET  | `WechatAuthController.callback`           | ❌ 无需前端调用（微信回调） | ℹ️   |
| `/auth/wechat/status`      | GET  | `WechatAuthController.getStatus`          | ❌ 未实现                   | ⚠️   |
| `/auth/wechat/bind-qrcode` | GET  | `WechatAuthController.generateBindQrcode` | ❌ 未实现                   | ⚠️   |

**说明**：

- `/auth/wechat/callback` 由微信服务器直接调用，前端无需实现
- `/auth/wechat/qrcode` 用于生成登录二维码，前端需要实现调用
- `/auth/wechat/status` 用于轮询查询登录状态，前端需要实现调用
- `/auth/wechat/bind-qrcode` 用于已登录用户绑定微信，前端需要实现调用

---

## 📋 数据格式匹配情况

### 登录响应格式

**后端返回** (`SignInResponse`):

```typescript
{
  message: string;
  data: {
    id: string;
    email: string;
    username: string;
    // ... 其他用户字段
  }
  tokens: {
    access_token: string;
    refresh_token: string;
    session_token: string;
    session_refresh_time: string; // ISO 日期字符串
  }
}
```

**前端期望** (`SignInDataSchema`):

```typescript
{
  message?: string; // 可选
  data: UserSchema;
  tokens: {
    refresh_token: string;
    access_token: string;
    session_token: string;
    session_refresh_time: string; // 会转换为 Date 对象
  };
}
```

**状态**: ✅ 匹配（前端将 `session_refresh_time` 从 ISO 字符串转换为 Date 对象）

### 刷新令牌响应格式

**后端返回** (`RefreshTokenResponse`):

```typescript
{
  message: string;
  access_token: string;
  refresh_token: string;
  access_token_refresh_time: string; // ISO 日期字符串
  session_token: string;
}
```

**前端期望** (`RefreshTokenSchema`):

```typescript
{
  refresh_token: string;
  access_token: string;
  session_token: string;
  access_token_refresh_time: Date; // 会从 ISO 字符串转换为 Date
}
```

**状态**: ✅ 匹配（前端将日期字符串转换为 Date 对象）

### 会话响应格式

**后端返回** (`SessionResponse`):

```typescript
{
  data: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ip: string;
    browser: string;
    device_os: string;
    device_type: string;
    device_name: string;
    location: string;
    refresh_token: string;
    user_id?: string;
    user?: User | string; // 可能返回 user 对象或 ID
  };
}
```

**前端期望** (`GetSessionSchema`):

```typescript
{
  data: {
    id: string;
    createdAt: Date; // 通过 z.coerce.date() 转换
    updatedAt: Date;
    ip: string;
    browser: string;
    device_os: string;
    device_type: string;
    device_name: string;
    location: string;
    refresh_token: string;
    user_id?: string;
    user?: string | { id: string }; // 通过 transform 转换为 user_id
  };
}
```

**状态**: ✅ 匹配（前端会处理 `user` 字段，转换为 `user_id`）

---

## 🔍 潜在问题

### 1. 删除账户端点

**前端请求**:

```typescript
DELETE / auth / delete -account;
Body: {
  user_id: string;
  password: string;
}
```

**后端期望** (`DeleteUserDto`):

```typescript
{
  user_id: string;
  password: string;
}
```

**状态**: ✅ 匹配

### 2. 登出端点

**前端请求**:

```typescript
POST / auth / sign - out;
Body: {
  session_token: string;
}
Headers: {
  Authorization: Bearer<access_token>;
}
```

**后端期望** (`SignOutUserDto`):

```typescript
{
  session_token: string;
}
```

**状态**: ✅ 匹配

### 3. 修改密码端点

**前端请求**:

```typescript
PATCH / auth / change - password;
Body: {
  identifier: string; // 从 session 中获取 email
  password: string; // 当前密码
  newPassword: string; // 新密码
}
```

**后端期望** (`ChangePasswordDto`):

```typescript
{
  identifier: string;
  password: string;
  newPassword: string;
}
```

**状态**: ✅ 匹配

---

## 🎯 建议

### 需要实现的功能

1. **微信登录功能**
   - 实现 `/auth/wechat/qrcode` 调用，生成登录二维码
   - 实现 `/auth/wechat/status` 轮询，检查登录状态
   - 实现登录成功后的令牌处理和用户会话创建
   - 实现 `/auth/wechat/bind-qrcode` 调用，用于已登录用户绑定微信

2. **微信登录页面**
   - 创建 `/auth/wechat` 页面，显示二维码
   - 创建 `/auth/wechat/success` 页面，处理登录成功后的重定向
   - 创建 `/auth/wechat/error` 页面，处理登录失败后的重定向

### 代码示例

#### 1. 生成微信登录二维码

```typescript
// apps/web/server/auth.server.ts
export const generateWechatQrcode = safeAction.action(async () => {
  const [error, data] = await safeFetch(
    z.object({
      ticket: z.string(),
      qrcodeUrl: z.string().url(),
      expiresIn: z.number(),
    }),
    '/auth/wechat/qrcode',
    {
      method: 'GET',
      cache: 'no-store',
    },
  );

  if (error || !data) throw new Error(error || 'Failed to generate QR code');
  return data;
});
```

#### 2. 轮询登录状态

```typescript
// apps/web/server/auth.server.ts
export const getWechatLoginStatus = safeAction
  .schema(z.object({ ticket: z.string() }))
  .action(async ({ parsedInput }) => {
    const [error, data] = await safeFetch(
      z.object({
        status: z.enum(['pending', 'success', 'failed']),
        ticket: z.string(),
        data: z
          .object({
            user: UserSchema,
            tokens: z.object({
              access_token: z.string(),
              refresh_token: z.string(),
              session_token: z.string(),
              session_refresh_time: z.string(),
            }),
          })
          .optional(),
        error: z.string().optional(),
      }),
      `/auth/wechat/status?ticket=${parsedInput.ticket}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    );

    if (error) throw new Error(error);
    return data;
  });
```

#### 3. 生成绑定微信二维码

```typescript
// apps/web/server/auth.server.ts
export const generateWechatBindQrcode = safeAction.action(async () => {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');

  const [error, data] = await safeFetch(
    z.object({
      ticket: z.string(),
      qrcodeUrl: z.string().url(),
      expiresIn: z.number(),
    }),
    '/auth/wechat/bind-qrcode',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.user.tokens.access_token}`,
      },
      cache: 'no-store',
    },
  );

  if (error || !data)
    throw new Error(error || 'Failed to generate bind QR code');
  return data;
});
```

---

## 📝 总结

### 匹配状态

- ✅ **已匹配**: 12 个核心认证端点（注册、登录、登出、会话、邮箱验证、密码管理、令牌刷新、账户删除）
- ❌ **未匹配**: 3 个微信认证端点（前端未实现）
- ℹ️ **无需匹配**: 1 个微信回调端点（由微信服务器调用）

### 优先级

1. **高优先级**: 实现微信登录功能，包括二维码生成和状态轮询
2. **中优先级**: 实现微信绑定功能，允许已登录用户绑定微信账号
3. **低优先级**: 优化错误处理和用户体验

---

**文档生成时间**: 2024-12-28
**后端版本**: `apps/iam-api` (包含微信登录功能)
**前端版本**: `apps/web` (Next.js + NextAuth)
