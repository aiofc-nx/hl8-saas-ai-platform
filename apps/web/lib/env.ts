import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * @description 环境变量配置
 * 使用 @t3-oss/env-nextjs 进行类型安全的环境变量验证
 * 构建时会使用默认值，运行时需要正确配置环境变量
 */
export const env = createEnv({
  server: {
    API_URL: z.string().url().default('http://localhost:8000'),
    AUTH_SESSION_AGE: z.coerce.number().default(604800), // 默认 7 天
    AUTH_SECRET: z.string().default('dev-secret-key-change-in-production'),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    AUTH_URL: z.string().url().default('http://localhost:3001'),
  },
  client: {},
  runtimeEnv: {
    API_URL: process.env.API_URL,
    AUTH_SESSION_AGE: process.env.AUTH_SESSION_AGE,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    AUTH_URL: process.env.AUTH_URL,
  },
});
