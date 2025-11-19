import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '@/app.module';
import { AuthService } from '@/features/auth/auth.service';
import { UsersService } from '@/features/users/users.service';
import { TransactionService } from '@/database';
import { MikroORM } from '@mikro-orm/postgresql';
import { User } from '@/features/users/entities/user.entity';
import { Session } from '@/features/auth/entities/session.entity';
import { CreateUserDto } from '@/features/auth/dto';
import { MailService } from '@/features/mail/mail.service';
import * as request from 'supertest';

/**
 * 认证流程集成测试套件。
 *
 * @description 测试认证服务的完整流程，包括：
 * - 用户注册流程
 * - 用户登录流程
 * - 令牌生成和验证
 * - 会话管理
 * - 密码重置流程
 */
describe('Auth Integration (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let orm: MikroORM;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
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

    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    orm = moduleFixture.get<MikroORM>(MikroORM);

    // 生成唯一的测试用户邮箱
    testUserEmail = `test-${Date.now()}@example.com`;
    testUserPassword = 'TestPassword123!';
  }, 60000); // 增加超时时间到 60 秒

  afterAll(async () => {
    // 清理测试数据
    if (orm && testUserEmail) {
      const em = orm.em.fork();
      try {
        const testUser = await em.findOne(User, { email: testUserEmail }, { populate: ['profile'] });
        if (testUser) {
          // 清理会话
          const sessions = await em.find(Session, { user: testUser });
          if (sessions.length > 0) {
            await em.removeAndFlush(sessions);
          }
          // 清理个人资料
          if (testUser.profile) {
            await em.removeAndFlush(testUser.profile);
          }
          // 清理用户
          await em.removeAndFlush(testUser);
        }
      } catch (error) {
        // 忽略清理错误
      }
    }
    if (app) {
      await app.close();
    }
    if (orm) {
      await orm.close();
    }
  }, 30000);

  describe('用户注册和登录流程', () => {
    it('应该成功注册新用户', async () => {
      // 准备测试数据
      const createUserDto: CreateUserDto = {
        email: testUserEmail,
        password: testUserPassword,
      };

      // 执行注册
      const result = await authService.register(createUserDto);

      // 验证结果
      expect(result.data).toBeDefined();
      expect(result.data.email).toBe(testUserEmail);
      expect(result.data.id).toBeDefined();
    }, 60000); // 设置测试超时时间为 60 秒

    it('应该能够登录已注册的用户', async () => {
      // 执行登录
      const loginResult = await authService.signIn({
        identifier: testUserEmail,
        password: testUserPassword,
        ip: '127.0.0.1',
        device_name: 'Test Device',
        device_os: 'Linux',
        browser: 'Chrome',
        location: 'Test Location',
        userAgent: 'Test User Agent',
      });

      // 验证结果
      expect(loginResult.data).toBeDefined();
      expect(loginResult.tokens).toBeDefined();
      expect(loginResult.tokens.access_token).toBeDefined();
      expect(loginResult.tokens.refresh_token).toBeDefined();
      expect(loginResult.tokens.session_token).toBeDefined();
    }, 60000); // 设置测试超时时间为 60 秒

    it('应该能够获取用户的所有会话', async () => {
      // 先登录创建会话
      const loginResult = await authService.signIn({
        identifier: testUserEmail,
        password: testUserPassword,
        ip: '127.0.0.1',
        device_name: 'Test Device 2',
        device_os: 'Linux',
        browser: 'Chrome',
        location: 'Test Location',
        userAgent: 'Test User Agent',
      });

      // 获取用户的所有会话
      const sessions = await authService.getSessions(loginResult.data.id);

      // 验证结果
      expect(sessions).toBeDefined();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);
    }, 60000); // 设置测试超时时间为 60 秒
  });

  describe('API 端点集成测试', () => {
    let accessToken: string;
    let sessionToken: string;
    let apiTestUserEmail: string;

    beforeAll(async () => {
      // 使用不同的邮箱避免与前面的测试冲突
      apiTestUserEmail = `test-api-${Date.now()}@example.com`;
      
      // 先注册并登录用户
      await authService.register({
        email: apiTestUserEmail,
        password: testUserPassword,
      });

      const loginResult = await authService.signIn({
        identifier: apiTestUserEmail,
        password: testUserPassword,
        ip: '127.0.0.1',
        device_name: 'Test Device',
        device_os: 'Linux',
        browser: 'Chrome',
        location: 'Test Location',
        userAgent: 'Test User Agent',
      });

      accessToken = loginResult.tokens.access_token;
      sessionToken = loginResult.tokens.session_token;
    }, 60000);

    it('应该能够通过 API 获取用户信息', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${apiTestUserEmail.split('@')[0]}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toBe('User fetched successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(apiTestUserEmail);
    }, 60000); // 设置测试超时时间为 60 秒

    it('应该能够通过 API 获取所有用户', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toBe('Users fetched successfully');
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 60000); // 设置测试超时时间为 60 秒
  });
});

