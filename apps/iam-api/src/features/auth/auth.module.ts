import { DatabaseModule } from '@/database';
import { Otp } from '@/features/auth/entities/otp.entity';
import { Session } from '@/features/auth/entities/session.entity';
import { Profile } from '@/features/users/entities/profile.entity';
import { User } from '@/features/users/entities/user.entity';
import { MikroOrmModule } from '@hl8/mikro-orm-nestjs';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  SessionVerifierProvider,
  SessionVerifierService,
} from './session-verifier.service';
import { WechatLoginTicket } from './wechat/entities/wechat-login-ticket.entity';
import { WechatAuthController } from './wechat/wechat-auth.controller';
import { WechatAuthService } from './wechat/wechat-auth.service';

/**
 * 认证模块。
 *
 * @description 提供用户认证、注册、会话管理和安全相关功能。
 */
/**
 * 认证模块。
 *
 * @description 提供用户认证、注册、会话管理和安全相关功能。
 * 包括：
 * - 用户名/密码登录
 * - JWT 令牌生成和管理
 * - 会话管理
 * - 微信扫码登录
 */
@Module({
  imports: [
    DatabaseModule,
    HttpModule, // 用于微信 API 请求
    MikroOrmModule.forFeature({
      entities: [User, Session, Otp, Profile, WechatLoginTicket],
    }),
    // Hl8AuthModule 在 AppModule 中已全局注册，守卫和依赖自动可用
    // JwtRefreshGuard、AUTH_CONFIG、JwtService 都从全局模块中获取
    // 不再需要导入 JwtModule 或提供 JwtRefreshGuard、AUTH_CONFIG
  ],
  controllers: [AuthController, WechatAuthController],
  providers: [
    AuthService,
    SessionVerifierService,
    SessionVerifierProvider, // 保留：应用特定的 SESSION_VERIFIER 实现
    WechatAuthService,
    // 不再需要 JwtRefreshGuard 和 AUTH_CONFIG（从全局 Hl8AuthModule 获取）
  ],
  exports: [AuthService],
})
export class AuthModule {}
