/**
 * 集成测试设置文件。
 *
 * @description 在运行集成测试之前执行的设置代码。
 * 可以用于配置测试环境、清理数据库等操作。
 */

import 'reflect-metadata';

// 设置测试环境变量，确保 MikroORM 允许全局上下文
process.env.NODE_ENV = 'test';

// 服务器配置
process.env.HOST = 'localhost';
process.env.PORT = '3000';
process.env.ALLOW_CORS_URL = 'http://localhost:3000';

// JWT 配置
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret-key-min-10-chars';
process.env.ACCESS_TOKEN_EXPIRATION = '15m';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-key-min-10-chars';
process.env.REFRESH_TOKEN_EXPIRATION = '7d';

// 数据库配置
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_SSL = 'false';

// 配置邮件服务环境变量，使用无效配置以快速失败（避免连接超时）
// 邮件发送失败不会影响测试，因为代码中已有 try-catch
process.env.MAIL_HOST = 'smtp.invalid';
process.env.MAIL_USERNAME = 'test@invalid.com';
process.env.MAIL_PASSWORD = 'invalid';
process.env.MAIL_PORT = '587';
process.env.MAIL_SECURE = 'false';

// 文件存储配置
process.env.FILE_SYSTEM = 'public';
process.env.FILE_MAX_SIZE = '20971520';

// AWS S3 配置（可选，测试环境使用默认值）
process.env.AWS_REGION = '';
process.env.AWS_ACCESS_KEY_ID = '';
process.env.AWS_SECRET_ACCESS_KEY = '';
process.env.AWS_S3_BUCKET_NAME = '';
process.env.AWS_S3_ENDPOINT = '';
