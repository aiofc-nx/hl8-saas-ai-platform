#!/usr/bin/env ts-node
/**
 * 邮件发送测试脚本。
 *
 * @description 用于测试邮件配置是否正确，可以在生产环境部署前验证邮件服务。
 * 使用方法：NODE_ENV=production ts-node scripts/test-email.ts <recipient-email>
 *
 * @example
 * ```bash
 * # 测试发送邮件到指定邮箱
 * NODE_ENV=production ts-node scripts/test-email.ts test@example.com
 * ```
 */

import { MailService } from '@hl8/mail';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function testEmail() {
  // 获取收件人邮箱地址
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.error('❌ 错误：请提供收件人邮箱地址');
    console.log('使用方法: ts-node scripts/test-email.ts <recipient-email>');
    console.log('示例: ts-node scripts/test-email.ts test@example.com');
    process.exit(1);
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error(`❌ 错误：无效的邮箱地址: ${recipientEmail}`);
    process.exit(1);
  }

  console.log('🚀 开始测试邮件发送...');
  console.log(`📧 收件人: ${recipientEmail}`);
  console.log('');

  try {
    // 创建 NestJS 应用上下文
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // 获取邮件服务
    const mailService = app.get(MailService);

    // 发送测试邮件
    await mailService.sendEmail({
      to: [recipientEmail],
      subject: '邮件服务测试 - Email Service Test',
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>邮件服务测试</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin-top: 0;">✅ 邮件服务测试成功</h1>
            <p>这是一封测试邮件，用于验证邮件服务配置是否正确。</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin-bottom: 20px;">
            <h2 style="color: #2e7d32; margin-top: 0;">测试信息</h2>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>发送时间:</strong> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</li>
              <li><strong>收件人:</strong> ${recipientEmail}</li>
              <li><strong>测试类型:</strong> 生产环境邮件服务测试</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ 注意事项</h3>
            <p style="margin: 5px 0;">如果您收到了这封邮件，说明邮件服务配置正确，可以正常使用。</p>
            <p style="margin: 5px 0;">如果这是意外收到的邮件，请忽略即可。</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>此邮件由邮件服务测试脚本自动发送</p>
            <p>请勿回复此邮件</p>
          </div>
        </body>
        </html>
      `,
      text: `
邮件服务测试成功

这是一封测试邮件，用于验证邮件服务配置是否正确。

测试信息:
- 发送时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
- 收件人: ${recipientEmail}
- 测试类型: 生产环境邮件服务测试

注意事项:
如果您收到了这封邮件，说明邮件服务配置正确，可以正常使用。
如果这是意外收到的邮件，请忽略即可。

---
此邮件由邮件服务测试脚本自动发送
请勿回复此邮件
      `.trim(),
    });

    console.log('✅ 邮件发送成功！');
    console.log(`📬 请检查 ${recipientEmail} 的收件箱（包括垃圾邮件文件夹）`);
    console.log('');

    // 关闭应用上下文
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 邮件发送失败:');
    console.error('');

    if (error instanceof Error) {
      console.error(`错误信息: ${error.message}`);
      console.error('');

      // 提供常见错误解决方案
      if (
        error.message.includes('auth') ||
        error.message.includes('credentials')
      ) {
        console.error('💡 可能的解决方案:');
        console.error('   1. 检查 MAIL_USERNAME 和 MAIL_PASSWORD 是否正确');
        console.error(
          '   2. 如果使用 Gmail，请确保启用了"允许不够安全的应用"或使用应用专用密码',
        );
        console.error('   3. 如果使用 Outlook，请检查是否启用了 SMTP 访问');
      } else if (
        error.message.includes('connection') ||
        error.message.includes('timeout')
      ) {
        console.error('💡 可能的解决方案:');
        console.error('   1. 检查 MAIL_HOST 和 MAIL_PORT 是否正确');
        console.error('   2. 检查网络连接和防火墙设置');
        console.error('   3. 确认 SMTP 服务器地址和端口是否正确');
      } else if (
        error.message.includes('ENOTFOUND') ||
        error.message.includes('getaddrinfo')
      ) {
        console.error('💡 可能的解决方案:');
        console.error(
          '   1. 检查 MAIL_HOST 是否正确（应该是完整的 SMTP 服务器地址）',
        );
        console.error('   2. 检查 DNS 解析是否正常');
      }

      if (error.stack) {
        console.error('');
        console.error('详细错误堆栈:');
        console.error(error.stack);
      }
    } else {
      console.error('未知错误:', error);
    }

    console.error('');
    process.exit(1);
  }
}

// 运行测试
testEmail();
