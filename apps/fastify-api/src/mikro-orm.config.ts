import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { resolve } from 'path';

// 尝试加载 .env 文件（如果 dotenv 可用）
try {
  // 使用 process.cwd() 获取项目根目录，兼容 CommonJS 和 ES 模块
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { config } = require('dotenv');
  const envPath = resolve(process.cwd(), '.env');
  config({ path: envPath });
} catch {
  // dotenv 不可用，使用环境变量
}

/**
 * MikroORM 配置文件。
 *
 * @description 配置 MikroORM 与 PostgreSQL 数据库的连接，包括：
 * - 数据库连接参数（从环境变量读取）
 * - 实体路径配置
 * - 迁移配置
 * - 元数据提供者配置
 * - SQL 高亮配置
 *
 * @returns MikroORM 配置对象
 */
export default defineConfig({
  // 注意：在 NestJS 中，实际配置会通过 MikroOrmModule.forRoot() 传入
  // 此文件主要用于 CLI 工具（mikro-orm migration:create 等）
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  dbName: process.env.DB_NAME || 'fastify_api',
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    glob: '!(*.d).{js,ts}',
  },
  debug: process.env.NODE_ENV !== 'production',
  highlighter: new SqlHighlighter(),
  metadataProvider: TsMorphMetadataProvider,
  extensions: [Migrator],
  driverOptions: {
    connection: {
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
  },
});
