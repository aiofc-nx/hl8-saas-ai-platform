import { EnvConfig } from '@/common/utils/validateEnv';
import { MikroOrmModule } from '@hl8/mikro-orm-nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';

/**
 * 数据库模块，用于在 NestJS 应用中配置 MikroORM 与 PostgreSQL 的连接。
 *
 * @description 使用异步配置从环境变量加载数据库连接设置，支持：
 * - 通过 EnvConfig 从环境变量读取数据库配置
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
      inject: [EnvConfig],
      driver: PostgreSqlDriver,
      useFactory: (config: EnvConfig) => ({
        driver: PostgreSqlDriver,
        host: config.DB_HOST,
        port: parseInt(config.DB_PORT || '5432', 10),
        user: config.DB_USERNAME,
        password: config.DB_PASSWORD,
        dbName: config.DB_NAME,
        entities: ['dist/**/*.entity.js'],
        entitiesTs: ['src/**/*.entity.ts'],
        migrations: {
          path: 'dist/migrations',
          pathTs: 'src/migrations',
          glob: '!(*.d).{js,ts}',
        },
        debug: config.NODE_ENV !== 'production',
        // 在测试环境中允许使用全局 EntityManager 上下文
        allowGlobalContext: config.NODE_ENV === 'test',
        driverOptions: {
          connection: {
            ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
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
