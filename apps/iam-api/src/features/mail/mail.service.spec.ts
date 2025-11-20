import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

// Mock @repo/constants/app 模块
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
}));

/**
 * MailService 的单元测试套件。
 *
 * @description 测试邮件服务的核心功能，包括：
 * - 发送邮件
 * - 邮件配置验证
 * - 错误处理和日志记录
 */
describe('MailService', () => {
  let service: MailService;
  let mailerService: jest.Mocked<MailerService>;
  let configService: jest.Mocked<ConfigService>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    // 创建模拟的 MailerService
    mailerService = {
      sendMail: jest.fn(),
    } as unknown as jest.Mocked<MailerService>;

    // 创建模拟的 ConfigService
    configService = {
      get: jest.fn().mockReturnValue('test@example.com'),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mailerService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);

    // 创建 Logger spy 以测试日志记录
    loggerSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.mockRestore();
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('应该成功发送邮件', async () => {
      // 准备测试数据
      const mailOptions: ISendMailOptions = {
        to: ['recipient@example.com'],
        subject: 'Test Email',
        html: '<p>This is a test email</p>',
      };

      mailerService.sendMail = jest.fn().mockResolvedValue(undefined);
      configService.get = jest.fn().mockReturnValue('sender@example.com');

      // 执行测试
      await service.sendEmail(mailOptions);

      // 验证结果
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        from: expect.stringContaining('sender@example.com'),
        ...mailOptions,
      });
      expect(configService.get).toHaveBeenCalledWith('MAIL_USERNAME');
    });

    it('应该正确设置发件人地址', async () => {
      // 准备测试数据
      const mailOptions: ISendMailOptions = {
        to: ['recipient@example.com'],
        subject: 'Test Email',
        text: 'Test email content',
      };

      mailerService.sendMail = jest.fn().mockResolvedValue(undefined);
      configService.get = jest.fn().mockReturnValue('custom@example.com');

      // 执行测试
      await service.sendEmail(mailOptions);

      // 验证结果
      const callArgs = mailerService.sendMail.mock.calls[0][0];
      expect(callArgs.from).toContain('custom@example.com');
    });

    it('应该保留原始邮件选项', async () => {
      // 准备测试数据
      const mailOptions: ISendMailOptions = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Test Email',
        html: '<p>HTML content</p>',
        text: 'Plain text content',
        attachments: [
          {
            filename: 'test.pdf',
            path: '/path/to/test.pdf',
          },
        ],
      };

      mailerService.sendMail = jest.fn().mockResolvedValue(undefined);
      configService.get = jest.fn().mockReturnValue('sender@example.com');

      // 执行测试
      await service.sendEmail(mailOptions);

      // 验证结果
      const callArgs = mailerService.sendMail.mock.calls[0][0];
      expect(callArgs.to).toEqual(mailOptions.to);
      expect(callArgs.cc).toEqual(mailOptions.cc);
      expect(callArgs.bcc).toEqual(mailOptions.bcc);
      expect(callArgs.subject).toBe(mailOptions.subject);
      expect(callArgs.html).toBe(mailOptions.html);
      expect(callArgs.text).toBe(mailOptions.text);
      expect(callArgs.attachments).toEqual(mailOptions.attachments);
    });

    it('应该在发送成功时记录调试日志', async () => {
      // 准备测试数据
      const mailOptions: ISendMailOptions = {
        to: ['recipient@example.com'],
        subject: 'Test Email',
        html: '<p>Test</p>',
      };

      mailerService.sendMail = jest.fn().mockResolvedValue(undefined);
      configService.get = jest.fn().mockReturnValue('sender@example.com');

      // 执行测试
      await service.sendEmail(mailOptions);

      // 验证日志记录
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        '邮件发送成功',
        expect.objectContaining({
          to: mailOptions.to,
          subject: mailOptions.subject,
        }),
      );
    });

    it('应该在发送失败时记录错误日志并重新抛出异常', async () => {
      // 准备测试数据
      const mailOptions: ISendMailOptions = {
        to: ['recipient@example.com'],
        subject: 'Test Email',
        html: '<p>Test</p>',
      };

      const error = new Error('SMTP connection failed');
      mailerService.sendMail = jest.fn().mockRejectedValue(error);
      configService.get = jest.fn().mockReturnValue('sender@example.com');

      // 执行测试并验证抛出异常
      await expect(service.sendEmail(mailOptions)).rejects.toThrow(
        'SMTP connection failed',
      );

      // 验证错误日志记录
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        '邮件发送失败',
        expect.objectContaining({
          error: 'SMTP connection failed',
          to: mailOptions.to,
          subject: mailOptions.subject,
          stack: expect.any(String),
        }),
      );
    });

    it('应该处理非 Error 类型的异常', async () => {
      // 准备测试数据
      const mailOptions: ISendMailOptions = {
        to: ['recipient@example.com'],
        subject: 'Test Email',
        html: '<p>Test</p>',
      };

      const error = 'String error';
      mailerService.sendMail = jest.fn().mockRejectedValue(error);
      configService.get = jest.fn().mockReturnValue('sender@example.com');

      // 执行测试并验证抛出异常
      await expect(service.sendEmail(mailOptions)).rejects.toBe(error);

      // 验证错误日志记录
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        '邮件发送失败',
        expect.objectContaining({
          error: 'String error',
          to: mailOptions.to,
          subject: mailOptions.subject,
        }),
      );
    });
  });
});
