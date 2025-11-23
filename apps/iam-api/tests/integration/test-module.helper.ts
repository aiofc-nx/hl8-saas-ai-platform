/**
 * 测试模块辅助函数。
 *
 * @description 为集成测试创建测试模块，使用测试配置加载器。
 */

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
import { AuthModule as Hl8AuthModule } from '@hl8/auth';
import { JwtAuthGuard, RolesGuard } from '@hl8/auth/guards';
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
  imports: [
    TypedConfigModule.forRoot({
      schema: EnvConfig,
      load: testConfigLoader(),
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: 'test-jwt-secret-key-min-10-chars',
      signOptions: { expiresIn: '15m' },
    }),
    Hl8AuthModule.forRootAsync({
      inject: [EnvConfig],
      useFactory: (config: EnvConfig) => ({
        accessTokenSecret: config.ACCESS_TOKEN_SECRET,
        accessTokenExpiration: config.ACCESS_TOKEN_EXPIRATION,
        refreshTokenSecret: config.REFRESH_TOKEN_SECRET,
        refreshTokenExpiration: config.REFRESH_TOKEN_EXPIRATION,
      }),
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
})
export class TestAppModule {}
