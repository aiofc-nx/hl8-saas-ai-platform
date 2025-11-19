import { Env } from '@/common/utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransactionService } from './transaction.service';

/**
 * 数据库模块，用于在 NestJS 应用中配置 MikroORM 与 PostgreSQL 的连接。
 *
 * @description 使用异步配置从环境变量加载数据库连接设置，支持：
 * - 通过 ConfigService 从环境变量读取数据库配置
 * - 自动加载实体
 * - 生产环境禁用调试模式
 * - 支持 SSL 连接
 *
 * @example
 * ```typescript
 * // 在其他模块中导入即可使用数据库连接
 * import { DatabaseModule } from '@/database';
 * ```
 */
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      driver: PostgreSqlDriver,
      useFactory: (config: ConfigService<Env>) => ({
        driver: PostgreSqlDriver,
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || '5432', 10),
        user: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        dbName: config.get('DB_NAME'),
        entities: ['dist/**/*.entity.js'],
        entitiesTs: ['src/**/*.entity.ts'],
        migrations: {
          path: 'dist/migrations',
          pathTs: 'src/migrations',
          glob: '!(*.d).{js,ts}',
        },
        debug: config.get('NODE_ENV') !== 'production',
        // 在测试环境中允许使用全局 EntityManager 上下文
        allowGlobalContext: config.get('NODE_ENV') === 'test',
        driverOptions: {
          connection: {
            ssl: config.get('DB_SSL') ? { rejectUnauthorized: false } : false,
          },
        },
      }),
    }),
  ],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class DatabaseModule {
  // TransactionService 通过依赖注入自动获取 MikroORM 实例
}
