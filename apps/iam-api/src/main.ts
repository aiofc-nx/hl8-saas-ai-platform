import { AppModule } from '@/app.module';
import { bootstrap } from '@/bootstrap';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

/**
 * 应用程序主入口函数，用于启动 NestJS Fastify 应用。
 *
 * @description 创建 NestJS 应用实例并调用引导函数完成应用初始化。
 * @returns {Promise<void>} 当应用成功启动时解析的 Promise。
 */
const main = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );
  await bootstrap(app);
};

/**
 * 调用主引导函数并处理错误。
 *
 * @description 执行主函数，捕获并记录启动过程中的任何错误，然后退出进程。
 * @returns {void}
 */
main().catch((error) => {
  console.log(error);
  process.exit(1);
});
