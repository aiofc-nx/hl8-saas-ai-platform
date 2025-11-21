import { TransactionService } from '@/database';
import { Profile } from '@/features/users/entities/profile.entity';
import { User } from '@/features/users/entities/user.entity';
import { MikroORM } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TestAppModule } from './test-module.helper';

/**
 * 数据库事务集成测试套件。
 *
 * @description 测试数据库事务服务的集成功能，包括：
 * - 事务执行
 * - 事务回滚
 * - 数据一致性
 */
describe('Database Transaction Integration (e2e)', () => {
  let transactionService: TransactionService;
  let orm: MikroORM;

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule],
      }).compile();

      transactionService =
        moduleFixture.get<TransactionService>(TransactionService);
      orm = moduleFixture.get<MikroORM>(MikroORM);

      // 验证服务是否正确注入
      if (!transactionService) {
        throw new Error(
          'TransactionService 未正确注入。请检查模块配置和数据库连接。',
        );
      }
      if (!orm) {
        throw new Error('MikroORM 未正确注入。请检查数据库连接配置。');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('password authentication failed')) {
        throw new Error(
          `数据库认证失败。请检查数据库密码是否正确。\n` +
            `提示：设置 DB_PASSWORD 环境变量，例如：DB_PASSWORD=your_password pnpm test:integration\n` +
            `原始错误：${errorMessage}`,
        );
      }
      throw error;
    }
  });

  afterAll(async () => {
    // 清理测试数据
    if (orm) {
      const em = orm.em.fork();
      try {
        // 清理测试用户
        const testUsers = await em.find(
          User,
          {
            email: { $like: 'test-tx-%' },
          },
          { populate: ['profile'] },
        );
        for (const user of testUsers) {
          if (user.profile) {
            await em.removeAndFlush(user.profile);
          }
          await em.removeAndFlush(user);
        }
      } catch (_error) {
        // 忽略清理错误
      }
      await orm.close();
    }
  }, 30000);

  describe('事务执行', () => {
    it('应该成功在事务中创建用户和个人资料', async () => {
      const testEmail = `test-tx-${Date.now()}@example.com`;
      const testUsername = testEmail.split('@')[0];

      // 在事务中创建用户和个人资料
      const result = await transactionService.runInTransaction(async (em) => {
        const user = new User();
        user.email = testEmail;
        user.username = testUsername;
        user.password = 'hashed-password';
        em.persist(user);

        const profile = new Profile();
        profile.name = testUsername;
        profile.user = user;
        em.persist(profile);

        await em.flush();

        return { userId: user.id, profileId: profile.id };
      });

      // 验证结果
      expect(result.userId).toBeDefined();
      expect(result.profileId).toBeDefined();

      // 验证数据已保存
      const em = orm.em.fork();
      const savedUser = await em.findOne(User, { id: result.userId });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(testEmail);

      const savedProfile = await em.findOne(Profile, { id: result.profileId });
      expect(savedProfile).toBeDefined();
      expect(savedProfile?.user.id).toBe(result.userId);
    });

    it('应该在事务失败时回滚所有更改', async () => {
      const testEmail = `test-tx-rollback-${Date.now()}@example.com`;
      const testUsername = testEmail.split('@')[0];

      // 尝试在事务中创建用户，但故意抛出错误
      await expect(
        transactionService.runInTransaction(async (em) => {
          const user = new User();
          user.email = testEmail;
          user.username = testUsername;
          user.password = 'hashed-password';
          em.persist(user);

          await em.flush();

          // 故意抛出错误以触发回滚
          throw new Error('Transaction rollback test');
        }),
      ).rejects.toThrow('Transaction rollback test');

      // 验证数据未保存
      const em = orm.em.fork();
      const savedUser = await em.findOne(User, { email: testEmail });
      expect(savedUser).toBeNull();
    });
  });

  describe('数据一致性', () => {
    it('应该确保事务中的数据一致性', async () => {
      const testEmail = `test-tx-consistency-${Date.now()}@example.com`;
      const testUsername = testEmail.split('@')[0];

      // 在事务中创建用户和个人资料
      await transactionService.runInTransaction(async (em) => {
        const user = new User();
        user.email = testEmail;
        user.username = testUsername;
        user.password = 'hashed-password';
        em.persist(user);

        const profile = new Profile();
        profile.name = testUsername;
        profile.user = user;
        em.persist(profile);

        await em.flush();

        // 在事务内部验证数据
        const userInTx = await em.findOne(User, { id: user.id });
        expect(userInTx).toBeDefined();
        expect(userInTx?.email).toBe(testEmail);

        const profileInTx = await em.findOne(Profile, {
          user: user.id,
        });
        expect(profileInTx).toBeDefined();
        expect(profileInTx?.user.id).toBe(user.id);
      });

      // 在事务外部验证数据
      const em = orm.em.fork();
      const savedUser = await em.findOne(User, { email: testEmail });
      expect(savedUser).toBeDefined();

      const savedProfile = await em.findOne(Profile, {
        user: savedUser?.id,
      });
      expect(savedProfile).toBeDefined();
      expect(savedProfile?.user.id).toBe(savedUser?.id);
    });
  });
});
