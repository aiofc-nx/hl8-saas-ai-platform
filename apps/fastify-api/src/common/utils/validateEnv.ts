import { z } from 'zod';

/**
 * Zod 模式，用于验证和类型化环境变量。
 *
 * @description 定义应用程序所需的所有环境变量及其验证规则，包括：
 * - 服务器配置（HOST、PORT、NODE_ENV）
 * - CORS 配置（ALLOW_CORS_URL）
 * - JWT 配置（访问令牌和刷新令牌的密钥和过期时间）
 * - 数据库配置（PostgreSQL 连接信息）
 * - 邮件服务配置（SMTP 服务器、端口、安全连接等）
 * - 文件存储配置（本地或 S3）
 * - AWS S3 配置（如果使用 S3 存储）
 */
export const EnvSchema = z.object({
  HOST: z.string(),
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: z.coerce.number(),
  ALLOW_CORS_URL: z.string().url(),
  ACCESS_TOKEN_SECRET: z.string().min(10).max(128),
  ACCESS_TOKEN_EXPIRATION: z.string().min(1).max(60),
  REFRESH_TOKEN_SECRET: z.string().min(10).max(128),
  REFRESH_TOKEN_EXPIRATION: z.string().min(1).max(365),
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.string().transform((value) => value === 'true'),
  MAIL_HOST: z.string(),
  MAIL_USERNAME: z.string(),
  MAIL_PASSWORD: z.string(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_SECURE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  FILE_SYSTEM: z.enum(['s3', 'public']),
  FILE_MAX_SIZE: z.coerce.number().default(20971520),
  AWS_REGION: z.string().default(''),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_S3_BUCKET_NAME: z.string().default(''),
  AWS_S3_ENDPOINT: z.string().default(''),
});

/**
 * 表示已验证的环境变量的类型。
 */
export type Env = z.infer<typeof EnvSchema>;

/**
 * 根据环境模式验证配置对象。
 *
 * @description 使用 EnvSchema 验证配置对象，确保所有必需的环境变量都存在且符合验证规则。
 * 此函数在应用启动时由 ConfigModule 调用，用于验证环境变量配置。
 *
 * @param {Record<string, unknown>} config - 要验证的配置对象。
 * @returns {Env} 已验证和类型化的环境变量。
 * @throws {Error} 如果验证失败，包含详细的错误信息。
 *
 * @example
 * ```typescript
 * // 在 ConfigModule 中使用
 * ConfigModule.forRoot({
 *   validate: validateEnv,
 * })
 * ```
 */
export const validateEnv = (config: Record<string, unknown>): Env => {
  const validate = EnvSchema.safeParse(config);
  if (!validate.success) {
    throw new Error(validate.error.message);
  }
  return validate.data;
};
