import { User } from '@/features/users/entities/user.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * 健康检查模块。
 *
 * @description 提供系统健康检查功能，包括 HTTP、数据库、磁盘和内存健康检查。
 */
@Module({
  imports: [
    TerminusModule,
    HttpModule,
    MikroOrmModule.forFeature({ entities: [User] }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
