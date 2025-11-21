/**
 * 测试配置加载器。
 *
 * @description 为集成测试提供配置加载器，直接返回测试环境所需的配置对象。
 * 支持从环境变量读取配置，如果未设置则使用默认值。
 * 对于数据库配置，建议通过环境变量设置正确的值。
 */

import { ConfigLoader } from '@hl8/config';

/**
 * 创建测试配置加载器。
 *
 * @description 返回一个配置加载器，直接返回测试环境所需的配置对象。
 * 使用大写键名以匹配 EnvConfig 类的属性名（如 HOST、PORT 等）。
 * 虽然验证逻辑会跳过大写键，但配置加载器返回的配置应该被允许。
 *
 * @remarks
 * 数据库配置说明：
 * - 默认配置匹配 docker-compose.yml 中的 PostgreSQL 容器配置
 * - 默认用户名: aiofix，密码: aiofix，数据库: test_db
 * - 如果使用不同的配置，请通过环境变量覆盖
 * - 例如：DB_PASSWORD=your_password DB_NAME=your_db pnpm test:integration
 *
 * @returns 返回测试配置对象的加载器函数
 */
export const testConfigLoader = (): ConfigLoader => {
  // 默认配置匹配 docker-compose.yml 中的 PostgreSQL 容器
  const dbPassword = process.env.DB_PASSWORD || 'aiofix';
  const dbUsername = process.env.DB_USERNAME || 'aiofix';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'test_db';

  // 输出数据库连接信息（仅在非 CI 环境中）
  if (process.env.CI !== 'true') {
    console.info(
      `[测试配置] 数据库连接信息: ${dbUsername}@${dbHost}:${dbPort}/${dbName}`,
    );
  }

  return () => ({
    HOST: process.env.HOST || 'localhost',
    NODE_ENV: 'test',
    PORT: parseInt(process.env.PORT || '3000', 10),
    ALLOW_CORS_URL: process.env.ALLOW_CORS_URL || 'http://localhost:3000',
    ACCESS_TOKEN_SECRET:
      process.env.ACCESS_TOKEN_SECRET ||
      'test-access-token-secret-key-min-10-chars',
    ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
    REFRESH_TOKEN_SECRET:
      process.env.REFRESH_TOKEN_SECRET ||
      'test-refresh-token-secret-key-min-10-chars',
    REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
    DB_HOST: dbHost,
    DB_PORT: dbPort,
    DB_USERNAME: dbUsername,
    DB_PASSWORD: dbPassword,
    DB_NAME: dbName,
    DB_SSL: process.env.DB_SSL === 'true',
    MAIL_HOST: process.env.MAIL_HOST || 'smtp.invalid',
    MAIL_USERNAME: process.env.MAIL_USERNAME || 'test@invalid.com',
    MAIL_PASSWORD: process.env.MAIL_PASSWORD || 'invalid',
    MAIL_PORT: parseInt(process.env.MAIL_PORT || '587', 10),
    MAIL_SECURE: process.env.MAIL_SECURE === 'true',
    FILE_SYSTEM: (process.env.FILE_SYSTEM || 'public') as 's3' | 'public',
    FILE_MAX_SIZE: parseInt(process.env.FILE_MAX_SIZE || '20971520', 10),
    AWS_REGION: process.env.AWS_REGION || '',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || '',
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT || '',
  });
};
