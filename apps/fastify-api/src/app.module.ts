import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import {
  LoggerModule,
  NodeMailerModule,
  ThrottleModule,
} from '@/common/modules';
import { Env, validateEnv } from '@/common/utils';
import { DatabaseModule } from '@/database';
import { AuthModule } from '@/features/auth/auth.module';
import { FileModule } from '@/features/file/file.module';
import { UsersModule } from '@/features/users/users.module';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MikroORM } from '@mikro-orm/postgresql';
import { HealthModule } from './features/health/health.module';
import { MailModule } from './features/mail/mail.module';

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
  ],
  imports: [
    JwtModule.register({
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    NodeMailerModule,
    LoggerModule,
    ThrottleModule,
    MailModule,
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
   * @param config - 配置服务，用于访问环境变量。
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly config: ConfigService<Env>,
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
    const nodeEnv = this.config.get('NODE_ENV');
    // 仅在非生产环境自动运行迁移
    if (nodeEnv !== 'production') {
      await this.orm.getMigrator().up();
    }
  }
}
