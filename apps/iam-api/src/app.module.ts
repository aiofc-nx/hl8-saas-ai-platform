import {
  LoggerModule,
  NodeMailerModule,
  ThrottleModule,
} from '@/common/modules';
import { DatabaseModule } from '@/database';
import { AuthModule } from '@/features/auth/auth.module';
import { FileModule } from '@/features/file/file.module';
import { UsersModule } from '@/features/users/users.module';
import {
  AuthModule as Hl8AuthModule,
  JwtAuthGuard,
  RolesGuard,
} from '@hl8/auth';
import { TypedConfigModule, dotenvLoader } from '@hl8/config';
import {
  AnyExceptionFilter,
  ForbiddenExceptionFilter,
  HttpExceptionFilter,
  NotFoundExceptionFilter,
} from '@hl8/exceptions';
import { MailModule } from '@hl8/mail';
import { MikroORM } from '@mikro-orm/postgresql';
import { Module, OnModuleInit } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EnvConfig } from './common/utils/validateEnv';
import { HealthModule } from './features/health/health.module';

/**
 * 应用程序根模块。
 *
 * @description 配置全局守卫、环境变量验证，并导入所有功能模块。
 * 该模块是应用的入口点，负责：
 * - 注册全局守卫（JWT 认证守卫、角色守卫、限流守卫）
 * - 配置全局 JWT 模块
 * - 配置全局配置模块（环境变量验证）
 * - 导入所有功能模块（数据库、用户、认证、邮件、健康检查、文件等）
 * - 自动运行数据库迁移
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
    {
      provide: APP_FILTER,
      useClass: AnyExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ForbiddenExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
  ],
  imports: [
    JwtModule.register({
      global: true,
    }),
    TypedConfigModule.forRoot({
      schema: EnvConfig,
      load: dotenvLoader(),
      isGlobal: true,
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
})
export class AppModule implements OnModuleInit {
  /**
   * 创建 AppModule 实例。
   *
   * @param orm - MikroORM 实例，用于数据库迁移。
   * @param config - 环境配置，用于访问环境变量。
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly config: EnvConfig,
  ) {}

  /**
   * 模块初始化时自动运行数据库迁移。
   *
   * @description 在应用启动时自动执行待处理的数据库迁移，确保数据库架构是最新的。
   * 注意：仅在非生产环境中自动运行迁移，生产环境应手动运行迁移。
   *
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    const nodeEnv = this.config.NODE_ENV;
    // 仅在非生产环境自动运行迁移
    if (nodeEnv !== 'production') {
      await this.orm.getMigrator().up();
    }
  }
}
