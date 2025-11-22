/**
 * 测试模块辅助函数。
 *
 * @description 为集成测试创建测试模块，使用测试配置加载器。
 */

import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import {
  LoggerModule,
  NodeMailerModule,
  ThrottleModule,
} from '@/common/modules';
import { EnvConfig } from '@/common/utils/validateEnv';
import { DatabaseModule } from '@/database';
import { AuthModule } from '@/features/auth/auth.module';
import { FileModule } from '@/features/file/file.module';
import { HealthModule } from '@/features/health/health.module';
import { UsersModule } from '@/features/users/users.module';
import { TypedConfigModule } from '@hl8/config';
import { MailModule } from '@hl8/mail';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { testConfigLoader } from './test-config.loader';

/**
 * 测试应用模块。
 *
 * @description 创建一个使用测试配置的 AppModule，用于集成测试。
 * 这个模块使用测试配置加载器而不是 dotenvLoader。
 */
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  imports: [
    JwtModule.register({
      global: true,
    }),
    TypedConfigModule.forRoot({
      schema: EnvConfig,
      load: testConfigLoader(),
      isGlobal: true,
    }),
    DatabaseModule,
    NodeMailerModule,
    LoggerModule,
    ThrottleModule,
    MailModule.forRoot(EnvConfig),
    HealthModule,
    FileModule,
    UsersModule,
    AuthModule,
  ],
})
export class TestAppModule {}
