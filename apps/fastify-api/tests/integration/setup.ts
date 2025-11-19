/**
 * 集成测试设置文件。
 *
 * @description 在运行集成测试之前执行的设置代码。
 * 可以用于配置测试环境、清理数据库等操作。
 */

// 设置测试环境变量，确保 MikroORM 允许全局上下文
process.env.NODE_ENV = 'test';

// 配置邮件服务环境变量，使用无效配置以快速失败（避免连接超时）
// 邮件发送失败不会影响测试，因为代码中已有 try-catch
process.env.MAIL_HOST = 'smtp.invalid';
process.env.MAIL_USERNAME = 'test@invalid.com';
process.env.MAIL_PASSWORD = 'invalid';

// 设置测试超时时间
jest.setTimeout(60000);

// 在测试开始前执行的全局设置
beforeAll(async () => {
  // 可以在这里初始化测试数据库连接等
});

// 在所有测试完成后执行的清理
afterAll(async () => {
  // 可以在这里关闭数据库连接等
});

