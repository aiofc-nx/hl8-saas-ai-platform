# 微信扫码登录实现方案

**创建日期**：2025-01-XX  
**实现位置**：应用层（`apps/iam-api`）  
**认证库**：`@hl8/auth`（复用 JWT 生成逻辑）

---

## 执行摘要

### 实现策略

**方案**：在应用层实现微信扫码登录，复用 `@hl8/auth` 的 JWT 生成逻辑

**理由**：

1. ✅ 微信登录是业务逻辑，不应硬编码在通用认证库中
2. ✅ 可以复用现有的 JWT 令牌生成逻辑
3. ✅ 保持 `@hl8/auth` 库的通用性和简洁性
4. ✅ 更容易维护和扩展

---

## 1. 微信扫码登录流程

### OAuth2 授权码流程

```
1. 前端请求生成二维码
   ↓
2. 后端生成微信授权 URL 和临时 ticket
   ↓
3. 前端展示二维码，开始轮询
   ↓
4. 用户扫码并授权
   ↓
5. 微信重定向到回调地址（携带 code）
   ↓
6. 后端用 code 换取 access_token 和 openid
   ↓
7. 后端用 access_token 和 openid 获取用户信息
   ↓
8. 后端创建或绑定用户，生成 JWT 令牌
   ↓
9. 后端更新 ticket 状态，返回结果
   ↓
10. 前端轮询获取结果，完成登录
```

### 详细步骤

#### 步骤 1-2：生成二维码

**前端请求**：

```typescript
GET / auth / wechat / qrcode;
```

**后端响应**：

```json
{
  "ticket": "ticket-uuid-here",
  "qrcodeUrl": "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=xxx",
  "expiresIn": 300
}
```

#### 步骤 3-4：用户扫码

- 前端展示二维码
- 前端开始轮询检查状态
- 用户使用微信扫描二维码
- 用户在微信中确认授权

#### 步骤 5-7：微信回调

**微信回调**：

```
GET /auth/wechat/callback?code=xxx&state=ticket-uuid
```

**后端处理**：

1. 验证 state（ticket）
2. 使用 code 换取 access_token
3. 使用 access_token 获取用户信息
4. 创建或绑定用户
5. 生成 JWT 令牌
6. 更新 ticket 状态为已扫描

#### 步骤 8-10：前端获取结果

**前端轮询**：

```typescript
GET /auth/wechat/status?ticket=ticket-uuid
```

**响应（未扫描）**：

```json
{
  "status": "pending",
  "ticket": "ticket-uuid"
}
```

**响应（已扫描，登录成功）**：

```json
{
  "status": "success",
  "ticket": "ticket-uuid",
  "data": {
    "user": { ... },
    "tokens": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

**响应（已扫描，登录失败）**：

```json
{
  "status": "failed",
  "ticket": "ticket-uuid",
  "error": "授权失败或用户拒绝"
}
```

---

## 2. 技术实现方案

### 2.1 目录结构

```
apps/iam-api/src/features/auth/
├── wechat/
│   ├── wechat-auth.service.ts      # 微信认证服务
│   ├── wechat-auth.controller.ts   # 微信登录控制器
│   ├── dto/
│   │   ├── wechat-qrcode.dto.ts    # 二维码 DTO
│   │   └── wechat-callback.dto.ts  # 回调 DTO
│   ├── entities/
│   │   └── wechat-login-ticket.entity.ts  # 登录票据实体
│   └── interfaces/
│       └── wechat-user.interface.ts       # 微信用户信息接口
├── auth.controller.ts               # 更新：添加微信路由
└── auth.service.ts                  # 更新：添加微信登录方法
```

### 2.2 数据库实体

#### WechatLoginTicket 实体

```typescript
@Entity()
export class WechatLoginTicket {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ unique: true })
  ticket!: string; // 唯一票据

  @Property({ nullable: true })
  code?: string; // 微信授权码

  @Property({ nullable: true })
  openid?: string; // 微信用户 openid

  @Property({ type: 'json', nullable: true })
  userInfo?: WechatUserInfo; // 微信用户信息

  @Property({ nullable: true })
  userId?: string; // 绑定的系统用户 ID

  @Property({ default: 'pending' })
  status!: 'pending' | 'scanned' | 'success' | 'failed'; // 状态

  @Property({ nullable: true })
  error?: string; // 错误信息

  @Property({ type: 'json', nullable: true })
  tokens?: AuthTokensInterface; // 生成的 JWT 令牌

  @Property()
  expiresAt!: Date; // 过期时间（5 分钟）

  @Property({ defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Property({ onUpdate: () => new Date(), defaultRaw: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  user?: User; // 关联的用户
}
```

### 2.3 环境配置

```typescript
// apps/iam-api/src/common/utils/validateEnv.ts
export class EnvConfig {
  // ... 现有配置

  @Expose()
  @IsString()
  public readonly WECHAT_APP_ID!: string; // 微信 AppID

  @Expose()
  @IsString()
  public readonly WECHAT_APP_SECRET!: string; // 微信 AppSecret

  @Expose()
  @IsString()
  public readonly WECHAT_REDIRECT_URI!: string; // 回调地址
}
```

---

## 3. 核心实现代码

### 3.1 微信用户信息接口

```typescript
// src/features/auth/wechat/interfaces/wechat-user.interface.ts
/**
 * 微信用户信息接口。
 *
 * @description 从微信开放平台获取的用户信息。
 */
export interface WechatUserInfo {
  /**
   * 用户唯一标识。
   */
  openid: string;

  /**
   * 用户昵称。
   */
  nickname?: string;

  /**
   * 用户头像 URL。
   */
  headimgurl?: string;

  /**
   * 用户性别（1=男，2=女，0=未知）。
   */
  sex?: number;

  /**
   * 用户所在省份。
   */
  province?: string;

  /**
   * 用户所在城市。
   */
  city?: string;

  /**
   * 用户所在国家。
   */
  country?: string;

  /**
   * 用户特权信息。
   */
  privilege?: string[];
}
```

### 3.2 微信认证服务

```typescript
// src/features/auth/wechat/wechat-auth.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@hl8/mikro-orm-nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { JwtService } from '@nestjs/jwt';
import { EnvConfig } from '@/common/utils/validateEnv';
import { AuthService } from '../auth.service';
import { WechatLoginTicket } from './entities/wechat-login-ticket.entity';
import { WechatUserInfo } from './interfaces/wechat-user.interface';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  GeneralBadRequestException,
  GeneralUnauthorizedException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';

/**
 * 微信认证服务。
 *
 * @description 处理微信扫码登录的完整流程，包括：
 * - 生成登录二维码
 * - 处理微信回调
 * - 获取用户信息
 * - 创建或绑定用户
 * - 生成 JWT 令牌
 */
@Injectable()
export class WechatAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: EnvConfig,
    private readonly authService: AuthService,
    @InjectRepository(WechatLoginTicket)
    private readonly ticketRepository: EntityRepository<WechatLoginTicket>,
    private readonly logger: Logger,
  ) {}

  /**
   * 生成微信登录二维码。
   *
   * @returns 包含 ticket 和二维码 URL 的对象
   */
  async generateQrcode(): Promise<{
    ticket: string;
    qrcodeUrl: string;
    expiresIn: number;
  }> {
    // 1. 生成唯一 ticket
    const ticket = uuidv4();

    // 2. 创建微信授权 URL
    const redirectUri = encodeURIComponent(this.config.WECHAT_REDIRECT_URI);
    const state = ticket; // 使用 ticket 作为 state
    const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${this.config.WECHAT_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

    // 3. 生成二维码图片 URL（使用在线服务或本地生成）
    // 注意：实际项目中，应该使用二维码生成库（如 qrcode）生成二维码图片
    // 这里返回授权 URL，前端可以使用该 URL 生成二维码
    const qrcodeUrl = authUrl; // 或者返回生成的二维码图片 URL

    // 4. 保存 ticket 到数据库
    const ticketEntity = new WechatLoginTicket();
    ticketEntity.ticket = ticket;
    ticketEntity.status = 'pending';
    ticketEntity.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟过期

    await this.ticketRepository.persistAndFlush(ticketEntity);

    return {
      ticket,
      qrcodeUrl, // 前端需要根据此 URL 生成二维码
      expiresIn: 300, // 5 分钟
    };
  }

  /**
   * 处理微信回调。
   *
   * @param code - 微信授权码
   * @param state - 状态码（ticket）
   * @returns Promise<void>
   */
  async handleCallback(code: string, state: string): Promise<void> {
    // 1. 验证 ticket
    const ticket = await this.ticketRepository.findOne({ ticket: state });
    if (!ticket) {
      throw new GeneralBadRequestException('无效的登录票据', 'INVALID_TICKET');
    }

    if (ticket.status !== 'pending') {
      throw new GeneralBadRequestException('登录票据已使用', 'TICKET_USED');
    }

    if (ticket.expiresAt < new Date()) {
      throw new GeneralBadRequestException('登录票据已过期', 'TICKET_EXPIRED');
    }

    // 2. 更新 ticket 状态
    ticket.status = 'scanned';
    ticket.code = code;

    try {
      // 3. 使用 code 换取 access_token
      const tokenResponse = await axios.get(
        'https://api.weixin.qq.com/sns/oauth2/access_token',
        {
          params: {
            appid: this.config.WECHAT_APP_ID,
            secret: this.config.WECHAT_APP_SECRET,
            code,
            grant_type: 'authorization_code',
          },
        },
      );

      if (tokenResponse.data.errcode) {
        throw new GeneralUnauthorizedException(
          `微信授权失败: ${tokenResponse.data.errmsg}`,
          'WECHAT_AUTH_FAILED',
        );
      }

      const { access_token, openid } = tokenResponse.data;

      // 4. 使用 access_token 和 openid 获取用户信息
      const userInfoResponse = await axios.get(
        'https://api.weixin.qq.com/sns/userinfo',
        {
          params: {
            access_token,
            openid,
            lang: 'zh_CN',
          },
        },
      );

      if (userInfoResponse.data.errcode) {
        throw new GeneralUnauthorizedException(
          `获取微信用户信息失败: ${userInfoResponse.data.errmsg}`,
          'WECHAT_USER_INFO_FAILED',
        );
      }

      const userInfo: WechatUserInfo = userInfoResponse.data;
      ticket.openid = openid;
      ticket.userInfo = userInfo;

      // 5. 查找或创建用户
      const user = await this.findOrCreateUser(userInfo);

      // 6. 生成 JWT 令牌（复用 AuthService 的逻辑）
      const tokens = await this.authService.generateTokens(user);

      // 7. 创建会话
      const session = await this.authService.createSession(
        user,
        tokens.refresh_token,
      );

      // 8. 更新 ticket
      ticket.userId = user.id;
      ticket.status = 'success';
      ticket.tokens = tokens;

      await this.ticketRepository.flush();

      this.logger.info('微信扫码登录成功', {
        openid,
        userId: user.id,
        ticket: state,
      });
    } catch (error) {
      // 处理错误
      ticket.status = 'failed';
      ticket.error = error instanceof Error ? error.message : '未知错误';
      await this.ticketRepository.flush();

      this.logger.error('微信扫码登录失败', {
        code,
        state,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 查找或创建用户。
   *
   * @param userInfo - 微信用户信息
   * @returns 用户实体
   */
  private async findOrCreateUser(userInfo: WechatUserInfo): Promise<User> {
    // 1. 查找是否已绑定微信的用户
    // 假设 User 实体有 wechatOpenid 字段
    let user = await this.authService.findUserByWechatOpenid(userInfo.openid);

    if (user) {
      // 更新用户信息
      // ... 更新逻辑
      return user;
    }

    // 2. 创建新用户
    // 注意：这里需要根据业务逻辑决定如何处理
    // 方案 A：直接创建用户（如果没有邮箱，使用 openid 作为用户名）
    // 方案 B：提示用户绑定现有账号
    // 这里使用方案 A 作为示例

    const userDto = {
      username: `wechat_${userInfo.openid.slice(0, 12)}`, // 使用 openid 前 12 位
      email: `${userInfo.openid}@wechat.local`, // 临时邮箱
      password: randomUUID(), // 随机密码（用户无法使用密码登录）
      wechatOpenid: userInfo.openid,
      // ... 其他信息
    };

    // 调用 AuthService 创建用户
    user = await this.authService.createWechatUser(userDto, userInfo);

    return user;
  }

  /**
   * 获取登录状态。
   *
   * @param ticket - 登录票据
   * @returns 登录状态和结果
   */
  async getLoginStatus(ticket: string): Promise<{
    status: 'pending' | 'scanned' | 'success' | 'failed';
    data?: any;
    error?: string;
  }> {
    const ticketEntity = await this.ticketRepository.findOne({ ticket });

    if (!ticketEntity) {
      throw new GeneralBadRequestException('无效的登录票据', 'INVALID_TICKET');
    }

    if (ticketEntity.expiresAt < new Date()) {
      throw new GeneralBadRequestException('登录票据已过期', 'TICKET_EXPIRED');
    }

    return {
      status: ticketEntity.status,
      data:
        ticketEntity.status === 'success'
          ? {
              user: ticketEntity.user,
              tokens: ticketEntity.tokens,
            }
          : undefined,
      error: ticketEntity.error,
    };
  }
}
```

### 3.3 微信登录控制器

```typescript
// src/features/auth/wechat/wechat-auth.controller.ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Public } from '@hl8/auth/decorators';
import { WechatAuthService } from './wechat-auth.service';
import { Response } from 'express';

/**
 * 微信认证控制器。
 *
 * @description 提供微信扫码登录相关的 API 端点。
 */
@Controller('auth/wechat')
export class WechatAuthController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}

  /**
   * 生成微信登录二维码。
   *
   * @returns 包含 ticket 和二维码 URL 的对象
   */
  @Public()
  @Get('qrcode')
  async generateQrcode() {
    return this.wechatAuthService.generateQrcode();
  }

  /**
   * 微信授权回调。
   *
   * @param code - 授权码
   * @param state - 状态码（ticket）
   * @param res - 响应对象
   */
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.wechatAuthService.handleCallback(code, state);

      // 重定向到前端页面（告知前端登录成功）
      // 前端页面应该开始轮询获取结果
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/wechat/success?ticket=${state}`);
    } catch (error) {
      // 重定向到错误页面
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/wechat/error?ticket=${state}`);
    }
  }

  /**
   * 获取登录状态。
   *
   * @param ticket - 登录票据
   * @returns 登录状态和结果
   */
  @Public()
  @Get('status')
  async getStatus(@Query('ticket') ticket: string) {
    return this.wechatAuthService.getLoginStatus(ticket);
  }
}
```

---

## 4. 前端实现示例

### 4.1 生成二维码

```typescript
// 前端代码示例（React）
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
        // 保存令牌，跳转到首页
        localStorage.setItem('access_token', data.data.tokens.access_token);
        window.location.href = '/';
      } else if (data.status === 'failed') {
        setStatus('failed');
        clearInterval(interval);
      }
    }, 2000); // 每 2 秒轮询一次

    return () => clearInterval(interval);
  }, [ticket]);

  return (
    <div>
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

## 5. 环境变量配置

```env
# 微信开放平台配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=http://your-domain.com/auth/wechat/callback
FRONTEND_URL=http://localhost:3000
```

---

## 6. 数据库迁移

需要创建 `WechatLoginTicket` 实体的迁移文件。

---

## 7. 集成到现有系统

### 7.1 更新 AuthModule

```typescript
// src/features/auth/auth.module.ts
@Module({
  imports: [
    // ... 现有导入
    MikroOrmModule.forFeature({ entities: [WechatLoginTicket] }),
  ],
  controllers: [
    AuthController,
    WechatAuthController, // 添加微信控制器
  ],
  providers: [
    AuthService,
    WechatAuthService, // 添加微信服务
    // ... 其他提供者
  ],
})
export class AuthModule {}
```

### 7.2 更新 User 实体（可选）

如果需要存储微信 openid，可以添加字段：

```typescript
@Entity()
export class User {
  // ... 现有字段

  @Property({ nullable: true, unique: true })
  wechatOpenid?: string; // 微信 openid

  // ... 其他字段
}
```

---

## 8. 安全考虑

### 8.1 票据管理

- ✅ Ticket 设置过期时间（5 分钟）
- ✅ Ticket 只能使用一次
- ✅ 使用 UUID 确保唯一性

### 8.2 状态验证

- ✅ 验证 state（ticket）是否有效
- ✅ 验证 ticket 状态
- ✅ 验证过期时间

### 8.3 错误处理

- ✅ 捕获所有错误
- ✅ 更新 ticket 状态
- ✅ 记录错误日志

---

## 9. 测试建议

### 9.1 单元测试

- 测试二维码生成
- 测试回调处理
- 测试用户创建/查找
- 测试状态查询

### 9.2 集成测试

- 测试完整的登录流程
- 测试错误场景
- 测试过期处理

---

## 10. 部署注意事项

### 10.1 微信开放平台配置

1. 配置授权回调域名（不需要协议，如：`your-domain.com`）
2. 确保回调地址可以访问
3. 配置网站应用的基本信息

### 10.2 前端部署

1. 确保前端可以访问后端 API
2. 配置正确的 `FRONTEND_URL`
3. 确保二维码可以正常显示

---

## 11. 故障排查

### 常见问题

1. **二维码无法生成**
   - 检查微信 AppID 和 AppSecret 是否正确
   - 检查授权回调域名是否配置正确

2. **扫码后无法回调**
   - 检查回调地址是否可访问
   - 检查 state（ticket）是否正确传递

3. **无法获取用户信息**
   - 检查 access_token 是否有效
   - 检查 scope 是否包含 snsapi_login

---

## 12. 扩展功能

### 12.1 用户绑定

允许用户绑定微信账号到现有账号：

```typescript
@Post('bind')
@UseGuards(JwtAuthGuard)
async bindWechat(@User() user: User, @Body() dto: BindWechatDto) {
  // 绑定逻辑
}
```

### 12.2 账号解绑

允许用户解绑微信账号：

```typescript
@Post('unbind')
@UseGuards(JwtAuthGuard)
async unbindWechat(@User() user: User) {
  // 解绑逻辑
}
```

---

## 13. 总结

### 实现要点

1. ✅ **在应用层实现**：微信登录逻辑在应用层，保持库的通用性
2. ✅ **复用现有逻辑**：使用 `AuthService.generateTokens()` 生成 JWT
3. ✅ **状态管理**：使用 ticket 管理登录状态
4. ✅ **安全性**：验证 state、过期时间等

### 下一步

1. 实现 `WechatAuthService`
2. 实现 `WechatAuthController`
3. 创建数据库实体和迁移
4. 前端实现二维码和轮询
5. 测试完整流程

---

**文档创建日期**：2025-01-XX  
**下一步**：开始实现核心代码
