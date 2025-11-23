import { swagger } from '@/swagger';
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { configureErrorTypeResolver } from '@hl8/exceptions';
import { Logger, LoggerErrorInterceptor } from '@hl8/logger';
import { ValidationPipe } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'path';
import { EnvConfig } from './common/utils/validateEnv';

/**
 * 初始化 NestJS Fastify 应用程序，配置中间件、安全、验证、CORS、静态资源、日志和 API 文档。
 *
 * @description 完成应用的完整引导配置，包括：
 * - 安全头设置（Helmet）
 * - 静态资源服务
 * - CORS 跨域配置
 * - 全局验证管道
 * - Swagger API 文档（非生产环境）
 * - 错误日志拦截器
 * - 文件上传支持
 * - 应用启动监听
 *
 * @param {NestFastifyApplication} app - NestFastifyApplication 应用实例。
 * @returns {Promise<void>} 当应用成功启动时解析的 Promise。
 * @throws {Error} 如果配置服务获取环境变量失败或应用启动失败。
 */
export const bootstrap = async (app: NestFastifyApplication): Promise<void> => {
  // 日志实例，用于记录应用事件
  const logger = app.get(Logger);

  // 环境配置，用于获取环境变量和其他设置
  const config = app.get(EnvConfig);

  // 配置异常文档链接（可选，根据实际需求配置）
  if (config.NODE_ENV !== 'production') {
    configureErrorTypeResolver({
      baseUrl: `${config.HOST}:${config.PORT}/docs/errors`,
      errorCodeMap: {
        // 可以根据实际业务错误码配置映射
        // 'USER_NOT_FOUND': '/user-not-found',
        // 'INVALID_CREDENTIALS': '/auth/invalid-credentials',
      },
      defaultPath: '/general',
    });
  }

  // 启用 CORS，配置允许的来源和方法
  // 处理 localhost 和 127.0.0.1 的映射，确保两者都被允许
  // 注意：CORS 插件应该在 Helmet 之前注册，以确保 CORS 头不会被 Helmet 覆盖
  const allowedOrigins = config.ALLOW_CORS_URL.split(',').flatMap((url) => {
    const trimmedUrl = url.trim();
    // 如果包含 localhost，同时添加 127.0.0.1 版本
    if (trimmedUrl.includes('localhost')) {
      return [trimmedUrl, trimmedUrl.replace('localhost', '127.0.0.1')];
    }
    // 如果包含 127.0.0.1，同时添加 localhost 版本
    if (trimmedUrl.includes('127.0.0.1')) {
      return [trimmedUrl, trimmedUrl.replace('127.0.0.1', 'localhost')];
    }
    return [trimmedUrl];
  });

  // 使用 Fastify 原生 CORS 插件
  // 直接使用数组形式的 origin 配置，更简单可靠
  // 开发环境下输出允许的 origin 列表以便调试
  if (config.NODE_ENV !== 'production') {
    logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  }

  await app.register(fastifyCors, {
    credentials: true,
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // 使用 Helmet 设置安全头（Fastify 插件）
  // 注意：Helmet 应该在 CORS 之后注册，以避免覆盖 CORS 头
  await app.register(helmet, {
    global: true,
    permittedCrossDomainPolicies: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // 使用 Fastify 静态插件提供静态资源服务
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'storage', 'public'),
    prefix: '/assets/',
    decorateReply: false,
    dotfiles: 'deny',
  });

  // 使用自定义日志记录器
  app.useLogger(logger);

  // 全局验证管道，用于请求验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger 设置，在非生产环境启用 API 文档
  if (config.NODE_ENV !== 'production') {
    await swagger(app);
  }

  // 全局错误日志拦截器
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // 注册 Fastify 多部分插件，支持文件上传
  await app.register(fastifyMultipart);

  // 启动应用并在配置的端口和主机上监听
  await app.listen(config.PORT, '0.0.0.0', () => {
    logger.log(`This application started at ${config.HOST}:${config.PORT}`);
  });
};
