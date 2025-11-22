import { AppModule } from '@/app.module';
import { MailService } from '@hl8/mail';
import { MikroORM } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

/**
 * 应用端到端测试套件。
 *
 * @description 测试应用的基本功能和健康检查端点。
 */
describe('AppController (e2e)', () => {
  let app: INestApplication;
  let orm: MikroORM;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    orm = moduleFixture.get<MikroORM>(MikroORM);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    if (orm) {
      await orm.close();
    }
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect((res) => {
        // 健康检查可能返回 200 或 503，取决于外部服务状态
        expect([200, 503]).toContain(res.status);
      });
  });

  it('/health/database (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/database')
      .expect((res) => {
        // 数据库健康检查可能返回 200 或 503
        expect([200, 503]).toContain(res.status);
      });
  });
});
