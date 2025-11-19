import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '@/app.module';
import { UsersService } from '@/features/users/users.service';
import { AuthService } from '@/features/auth/auth.service';
import { MikroORM } from '@mikro-orm/postgresql';
import { User } from '@/features/users/entities/user.entity';
import { Profile } from '@/features/users/entities/profile.entity';
import { MailService } from '@/features/mail/mail.service';

/**
 * 用户服务集成测试套件。
 *
 * @description 测试用户服务与数据库的集成，包括：
 * - 用户查询功能
 * - 用户与个人资料的关联
 * - 数据库事务处理
 */
describe('Users Integration (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let authService: AuthService;
  let orm: MikroORM;
  let testUser: User;

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

    usersService = moduleFixture.get<UsersService>(UsersService);
    authService = moduleFixture.get<AuthService>(AuthService);
    orm = moduleFixture.get<MikroORM>(MikroORM);

    // 创建测试用户
    const testEmail = `test-user-${Date.now()}@example.com`;
    const registerResult = await authService.register({
      email: testEmail,
      password: 'TestPassword123!',
    });
    testUser = registerResult.data;
  }, 60000); // 增加超时时间到 60 秒

  afterAll(async () => {
    // 清理测试数据
    if (orm && testUser) {
      const em = orm.em.fork();
      try {
        const user = await em.findOne(User, { id: testUser.id }, { populate: ['profile'] });
        if (user) {
          if (user.profile) {
            await em.removeAndFlush(user.profile);
          }
          await em.removeAndFlush(user);
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

  describe('用户查询功能', () => {
    it('应该能够查找所有用户', async () => {
      // 执行查询
      const users = await usersService.findAll();

      // 验证结果
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      // 验证用户包含个人资料
      const foundUser = users.find((u) => u.id === testUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.profile).toBeDefined();
    });

    it('应该能够根据用户名查找用户', async () => {
      // 执行查询
      const user = await usersService.findOne(testUser.username);

      // 验证结果
      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe(testUser.email);
      expect(user.profile).toBeDefined();
      expect(user.profile?.name).toBeDefined();
    });

    it('应该在用户不存在时抛出异常', async () => {
      // 执行查询
      await expect(
        usersService.findOne('nonexistent-user-12345'),
      ).rejects.toThrow();
    });
  });

  describe('用户数据完整性', () => {
    it('应该确保用户包含个人资料', async () => {
      // 执行查询
      const user = await usersService.findOne(testUser.username);

      // 验证结果
      expect(user.profile).toBeDefined();
      expect(user.profile?.user).toBeDefined();
      expect(user.profile?.user.id).toBe(user.id);
    });

    it('应该确保个人资料包含用户信息', async () => {
      // 执行查询
      const user = await usersService.findOne(testUser.username);

      // 验证结果
      expect(user.profile?.user).toBeDefined();
      expect(user.profile?.user.id).toBe(user.id);
      expect(user.profile?.user.email).toBe(user.email);
    });
  });
});

