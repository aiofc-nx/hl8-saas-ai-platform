import { Env } from '@/common/utils';
import { swagger } from '@/swagger';
import helmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { join } from 'path';

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

  // 配置服务，用于获取环境变量和其他设置
  const configService = app.get(ConfigService<Env>);

  // 使用 Helmet 设置安全头（Fastify 插件）
  await app.register(helmet, {
    global: true,
    permittedCrossDomainPolicies: false,
  });

  // 使用 Fastify 静态插件提供静态资源服务
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'storage', 'public'),
    prefix: '/assets/',
    decorateReply: false,
    dotfiles: 'deny',
  });

  // 启用 CORS，配置允许的来源和方法
  app.enableCors({
    credentials: true,
    origin: configService.get('ALLOW_CORS_URL').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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
  if (configService.get('NODE_ENV') !== 'production') {
    await swagger(app);
  }

  // 全局错误日志拦截器
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // 注册 Fastify 多部分插件，支持文件上传
  await app.register(fastifyMultipart);

  // 启动应用并在配置的端口和主机上监听
  await app.listen(configService.get('PORT')!, '0.0.0.0', () => {
    logger.log(
      `This application started at ${configService.get('HOST')}:${configService.get('PORT')}`,
    );
  });
};
