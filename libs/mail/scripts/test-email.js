#!/usr/bin/env ts-node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const __dirname = path.resolve(process.cwd(), 'libs/mail/scripts');
function loadEnvFile() {
  let envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, '../../../.env');
  }
  if (!fs.existsSync(envPath)) {
    envPath = path.join(process.cwd(), '../../.env');
  }
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts
            .join('=')
            .trim()
            .replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    }
  } else {
    console.warn('⚠️  警告: 未找到 .env 文件，将使用系统环境变量');
  }
}
loadEnvFile();
async function testEmail() {
  const recipientEmail = process.argv[2];
  if (!recipientEmail) {
    console.error('❌ 错误：请提供收件人邮箱地址');
    console.log('使用方法: pnpm test:email <recipient-email>');
    console.log('示例: pnpm test:email test@example.com');
    process.exit(1);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error(`❌ 错误：无效的邮箱地址: ${recipientEmail}`);
    process.exit(1);
  }
  const mailHost = process.env.MAIL_HOST;
  const mailUsername = process.env.MAIL_USERNAME;
  const mailPassword = process.env.MAIL_PASSWORD;
  const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);
  const mailSecure = process.env.MAIL_SECURE === 'true';
  if (!mailHost || !mailUsername || !mailPassword) {
    console.error('❌ 错误：邮件配置不完整');
    console.error('');
    console.error('请确保以下环境变量已设置:');
    console.error('  - MAIL_HOST');
    console.error('  - MAIL_USERNAME');
    console.error('  - MAIL_PASSWORD');
    console.error('');
    console.error('当前配置:');
    console.error(`  MAIL_HOST: ${mailHost || '(未设置)'}`);
    console.error(`  MAIL_USERNAME: ${mailUsername || '(未设置)'}`);
    console.error(`  MAIL_PASSWORD: ${mailPassword ? '***' : '(未设置)'}`);
    console.error(`  MAIL_PORT: ${mailPort}`);
    console.error(`  MAIL_SECURE: ${mailSecure}`);
    process.exit(1);
  }
  console.log('🚀 开始测试邮件发送...');
  console.log(`📧 收件人: ${recipientEmail}`);
  console.log(`📮 SMTP 服务器: ${mailHost}:${mailPort}`);
  console.log(`🔐 发件人: ${mailUsername}`);
  console.log('');
  const predefinedServices = [
    'gmail',
    'outlook',
    'yahoo',
    'hotmail',
    'qq',
    '163',
    '126',
    'sina',
    'sohu',
  ];
  const isPredefinedService = predefinedServices.includes(
    mailHost.toLowerCase(),
  );
  const transportConfig = isPredefinedService
    ? {
        service: mailHost,
        auth: {
          user: mailUsername,
          pass: mailPassword,
        },
      }
    : {
        host: mailHost,
        port: mailPort,
        secure: mailSecure,
        auth: {
          user: mailUsername,
          pass: mailPassword,
        },
      };
  const transporter = nodemailer.createTransport(transportConfig);
  try {
    console.log('🔍 验证 SMTP 连接...');
    await transporter.verify();
    console.log('✅ SMTP 连接验证成功');
    console.log('');
    console.log('📤 发送测试邮件...');
    const info = await transporter.sendMail({
      from: `邮件测试 <${mailUsername}>`,
      to: recipientEmail,
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
              <li><strong>SMTP 服务器:</strong> ${mailHost}:${mailPort}</li>
              <li><strong>测试类型:</strong> @hl8/mail 库测试</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ 注意事项</h3>
            <p style="margin: 5px 0;">如果您收到了这封邮件，说明邮件服务配置正确，可以正常使用。</p>
            <p style="margin: 5px 0;">如果这是意外收到的邮件，请忽略即可。</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>此邮件由 @hl8/mail 库测试脚本自动发送</p>
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
- SMTP 服务器: ${mailHost}:${mailPort}
- 测试类型: @hl8/mail 库测试

注意事项:
如果您收到了这封邮件，说明邮件服务配置正确，可以正常使用。
如果这是意外收到的邮件，请忽略即可。

---
此邮件由 @hl8/mail 库测试脚本自动发送
请勿回复此邮件
      `.trim(),
    });
    console.log('✅ 邮件发送成功！');
    console.log(`📬 邮件 ID: ${info.messageId}`);
    console.log(`📬 请检查 ${recipientEmail} 的收件箱（包括垃圾邮件文件夹）`);
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ 邮件发送失败:');
    console.error('');
    if (error instanceof Error) {
      console.error(`错误信息: ${error.message}`);
      console.error('');
      if (
        error.message.includes('auth') ||
        error.message.includes('credentials') ||
        error.message.includes('Authentication failed')
      ) {
        console.error('💡 可能的解决方案:');
        console.error('   1. 检查 MAIL_USERNAME 和 MAIL_PASSWORD 是否正确');
        if (mailHost.includes('qq.com') || mailHost === 'qq') {
          console.error('   2. QQ 邮箱必须使用授权码，不是 QQ 密码');
          console.error(
            '      获取授权码: 登录 QQ 邮箱 → 设置 → 账户 → 开启 POP3/SMTP 服务 → 生成授权码',
          );
        } else if (mailHost.includes('gmail.com') || mailHost === 'gmail') {
          console.error('   2. Gmail 必须使用应用专用密码，不是普通密码');
          console.error(
            '      获取应用专用密码: Google 账户 → 安全性 → 两步验证 → 应用专用密码',
          );
        } else if (mailHost.includes('163.com') || mailHost === '163') {
          console.error('   2. 163 邮箱必须使用授权码，不是普通密码');
          console.error(
            '      获取授权码: 登录 163 邮箱 → 设置 → POP3/SMTP/IMAP → 开启 SMTP 服务 → 生成授权码',
          );
        }
        console.error('   3. 确认邮箱账户未被锁定或限制');
      } else if (
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.message.includes('ETIMEDOUT')
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
      } else if (error.message.includes('self signed certificate')) {
        console.error('💡 可能的解决方案:');
        console.error('   1. 检查 MAIL_SECURE 配置是否正确');
        console.error(
          '   2. 确认端口和加密设置匹配（587 + false 或 465 + true）',
        );
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
  } finally {
    transporter.close();
  }
}
testEmail();
//# sourceMappingURL=test-email.js.map
