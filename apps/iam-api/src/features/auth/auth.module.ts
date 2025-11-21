import { DatabaseModule } from '@/database';
import { Otp } from '@/features/auth/entities/otp.entity';
import { Session } from '@/features/auth/entities/session.entity';
import { MailModule } from '@/features/mail/mail.module';
import { Profile } from '@/features/users/entities/profile.entity';
import { User } from '@/features/users/entities/user.entity';
import { MikroOrmModule } from '@hl8/mikro-orm-nestjs';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * 认证模块。
 *
 * @description 提供用户认证、注册、会话管理和安全相关功能。
 */
@Module({
  imports: [
    DatabaseModule,
    MikroOrmModule.forFeature({ entities: [User, Session, Otp, Profile] }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
