# 微信扫码登录配置指南

本指南将帮助您获取并配置微信扫码登录所需的环境变量。

---

## 📋 所需环境变量

- `WECHAT_APP_ID`: 微信应用 ID（AppID）
- `WECHAT_APP_SECRET`: 微信应用密钥（AppSecret）
- `WECHAT_REDIRECT_URI`: 微信授权回调地址

---

## 🚀 获取步骤

### 第一步：注册微信开放平台账号

1. **访问微信开放平台**
   - 网址：https://open.weixin.qq.com/
   - 点击右上角"注册"按钮

2. **填写注册信息**
   - 使用企业邮箱注册（个人邮箱可能无法通过审核）
   - 完成邮箱验证
   - 填写企业信息（企业名称、营业执照等）
   - 上传相关资质证明文件

3. **等待审核**
   - 审核时间通常为 1-3 个工作日
   - 审核通过后，您将收到邮件通知

---

### 第二步：创建网站应用

1. **登录微信开放平台**
   - 访问：https://open.weixin.qq.com/
   - 使用注册的账号登录

2. **进入管理中心**
   - 登录后，点击"管理中心"
   - 选择"网站应用" → "创建网站应用"

3. **填写应用信息**
   - **应用名称**：您的应用名称（例如：HL8 SaaS 平台）
   - **应用简介**：简要描述您的应用
   - **应用官网**：您的网站地址（例如：https://your-domain.com）
   - **应用图标**：上传应用图标（建议 200x200px）
   - **授权回调域名**：填写您的域名（**重要**：不需要协议，只填域名）
     - 例如：`your-domain.com` 或 `localhost`（开发环境）
     - **注意**：生产环境必须使用已备案的域名

4. **提交审核**
   - 填写完所有信息后，点击"提交审核"
   - 等待审核通过（通常 1-3 个工作日）

---

### 第三步：获取 AppID 和 AppSecret

1. **查看应用详情**
   - 审核通过后，在"管理中心" → "网站应用"中找到您的应用
   - 点击应用名称进入详情页

2. **获取 AppID**
   - 在应用详情页的"基本信息"中可以看到 **AppID**
   - 复制 AppID，这就是 `WECHAT_APP_ID` 的值

3. **获取 AppSecret**
   - 在应用详情页找到"开发信息"或"密钥"部分
   - 点击"查看"或"重置"按钮
   - 如果首次查看，需要设置密钥（建议使用强密码）
   - 复制 AppSecret，这就是 `WECHAT_APP_SECRET` 的值
   - **重要**：AppSecret 只显示一次，请妥善保存

---

### 第四步：配置回调地址

1. **确定回调地址格式**
   - 回调地址格式：`http://your-domain.com/auth/wechat/callback`
   - 开发环境示例：`http://localhost:8000/auth/wechat/callback`
   - 生产环境示例：`https://your-domain.com/auth/wechat/callback`

2. **配置授权回调域名**
   - 在应用详情页的"开发信息"中
   - 找到"授权回调域名"设置
   - 填写您的域名（**只填域名，不包含协议和路径**）
     - 开发环境：`localhost`
     - 生产环境：`your-domain.com`

3. **注意事项**
   - 回调域名必须与您填写的域名完全一致
   - 生产环境必须使用 HTTPS
   - 域名必须已备案（中国大陆服务器）

---

## ⚙️ 在项目中配置环境变量

### 1. 编辑 `.env` 文件

在 `apps/iam-api/.env` 文件中添加以下配置：

```env
# 微信开放平台配置
WECHAT_APP_ID=your_wechat_app_id_here
WECHAT_APP_SECRET=your_wechat_app_secret_here
WECHAT_REDIRECT_URI=http://localhost:8000/auth/wechat/callback

# 前端地址（用于重定向）
FRONTEND_URL=http://localhost:3000
```

### 2. 配置说明

#### 开发环境配置

```env
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_secret_key_here
WECHAT_REDIRECT_URI=http://localhost:8000/auth/wechat/callback
FRONTEND_URL=http://localhost:3000
```

#### 生产环境配置

```env
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_secret_key_here
WECHAT_REDIRECT_URI=https://your-domain.com/auth/wechat/callback
FRONTEND_URL=https://your-domain.com
```

### 3. 重启服务

配置完成后，重启后端服务以使环境变量生效：

```bash
# 停止当前服务（Ctrl+C）
# 重新启动
cd apps/iam-api
pnpm dev
```

---

## ✅ 验证配置

### 1. 测试二维码生成

访问以下端点，检查是否能正常生成二维码：

```bash
curl http://localhost:8000/auth/wechat/qrcode
```

**成功响应示例**：

```json
{
  "ticket": "uuid-here",
  "qrcodeUrl": "https://open.weixin.qq.com/connect/qrconnect?appid=wx1234567890abcdef&redirect_uri=...",
  "expiresIn": 300
}
```

**如果 `qrcodeUrl` 中的 `appid` 和 `redirect_uri` 参数不为空，说明配置成功！**

### 2. 测试完整登录流程

1. 访问前端微信登录页面
2. 扫描生成的二维码
3. 在微信中确认授权
4. 检查是否能成功登录

---

## 🔒 安全注意事项

1. **保护 AppSecret**
   - 永远不要将 AppSecret 提交到代码仓库
   - 使用 `.env` 文件存储，并确保 `.env` 在 `.gitignore` 中
   - 生产环境使用环境变量或密钥管理服务

2. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - 微信回调地址必须使用 HTTPS

3. **域名备案**
   - 如果服务器在中国大陆，域名必须已备案
   - 未备案的域名无法通过微信审核

4. **回调域名验证**
   - 确保回调域名与配置的域名完全一致
   - 开发环境可以使用 `localhost`，但生产环境必须使用真实域名

---

## 🐛 常见问题

### Q1: 审核不通过怎么办？

**A**: 常见原因：

- 应用名称或简介不符合规范
- 应用官网无法访问
- 域名未备案（生产环境）
- 缺少必要的资质证明

**解决方案**：

- 仔细阅读微信开放平台的审核规范
- 确保所有信息真实有效
- 提供完整的资质证明文件

### Q2: AppSecret 丢失了怎么办？

**A**:

- 在应用详情页找到"开发信息"
- 点击"重置"按钮生成新的 AppSecret
- **注意**：重置后旧的 AppSecret 将立即失效

### Q3: 回调地址不匹配怎么办？

**A**:

- 检查 `WECHAT_REDIRECT_URI` 配置是否正确
- 确保回调域名与微信开放平台中配置的域名一致
- 开发环境可以使用 `localhost`，生产环境必须使用真实域名

### Q4: 二维码生成失败？

**A**: 检查以下几点：

- `WECHAT_APP_ID` 是否正确
- `WECHAT_APP_SECRET` 是否正确
- `WECHAT_REDIRECT_URI` 格式是否正确
- 后端服务是否已重启

### Q5: 扫码后无法跳转？

**A**:

- 检查回调域名配置是否正确
- 确保回调地址可以正常访问
- 检查服务器防火墙设置
- 生产环境确保使用 HTTPS

---

## 📚 相关文档

- [微信开放平台官方文档](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [微信扫码登录实现文档](./wechat/README.md)
- [完整认证流程文档](./COMPLETE_AUTH_FLOW.md)

---

## 💡 提示

1. **开发环境测试**
   - 开发环境可以使用测试账号进行测试
   - 建议先在开发环境完成所有测试，再部署到生产环境

2. **审核时间**
   - 应用审核通常需要 1-3 个工作日
   - 建议提前申请，避免影响开发进度

3. **备用方案**
   - 在微信登录功能未就绪时，可以先使用其他登录方式
   - 微信登录可以作为可选的登录方式

---

**配置完成后，您的微信扫码登录功能就可以正常使用了！** 🎉
