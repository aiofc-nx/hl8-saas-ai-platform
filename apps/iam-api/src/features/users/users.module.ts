import { FileModule } from '@/features/file/file.module';
import { Profile } from '@/features/users/entities/profile.entity';
import { User } from '@/features/users/entities/user.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * 用户模块。
 *
 * @description 提供用户管理功能，包括用户查询和文件上传测试。
 */
@Module({
  imports: [
    MikroOrmModule.forFeature({ entities: [User, Profile] }),
    FileModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
