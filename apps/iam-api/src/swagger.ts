import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * 为应用程序设置 Swagger API 文档。
 *
 * @description 配置并启用 Swagger API 文档，包括：
 * - 设置 API 文档标题
 * - 配置 Bearer Token 认证支持
 * - 在 `/api-docs` 路径下提供文档访问
 *
 * @param {NestFastifyApplication} app - NestJS Fastify 应用实例。
 * @returns {Promise<void>} 当 Swagger 设置完成时解析的 Promise。
 */
export const swagger = async (app: NestFastifyApplication): Promise<void> => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Turbo repo')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);
};
