# localhost 与 127.0.0.1 页面差异说明

## 问题现象

访问 `http://localhost:5173/` 和 `http://127.0.0.1:5173/` 时，页面显示内容不一致。

## 问题原因

### 1. Cookie 域名隔离

浏览器将 `localhost` 和 `127.0.0.1` 视为**不同的域名**，因此它们的 Cookie 存储是**完全隔离**的。

本应用使用 Cookie 存储以下数据：

- **认证信息**：
  - `access_token` - 访问令牌
  - `refresh_token` - 刷新令牌
  - `session_token` - 会话令牌
  - `user_data` - 用户数据

- **用户偏好设置**：
  - `theme` - 主题（浅色/深色）
  - `font` - 字体设置
  - `direction` - 文本方向（LTR/RTL）
  - `layout_collapsible` - 布局折叠状态
  - `layout_variant` - 布局变体
  - `sidebar_state` - 侧边栏状态

### 2. 存储位置

Cookie 存储在浏览器的域名隔离空间中：

```
localhost:5173  →  Cookie 存储空间 A
127.0.0.1:5173  →  Cookie 存储空间 B
```

这两个存储空间互不共享，因此：

- 在 `localhost` 登录后，`127.0.0.1` 仍然是未登录状态
- 在 `localhost` 设置的主题，`127.0.0.1` 不会应用
- 两个地址的页面状态完全独立

## 解决方案

### 方案 1：统一使用 localhost（推荐）

**开发时统一使用 `http://localhost:5173`**，这是最常见的做法。

**优点**：

- 简单直接，无需额外配置
- 符合开发习惯
- 避免状态不一致问题

**操作**：

- 始终使用 `http://localhost:5173` 访问应用
- 如果浏览器自动跳转到 `127.0.0.1`，手动改为 `localhost`

### 方案 2：清除 Cookie 后重新登录

如果需要在两个地址间切换：

1. **清除当前地址的 Cookie**：
   - 打开浏览器开发者工具（F12）
   - 进入 Application/存储 → Cookies
   - 删除所有相关 Cookie

2. **在新地址重新登录**：
   - 访问新地址
   - 重新登录
   - 重新设置偏好

**注意**：每次切换地址都需要重新登录和设置。

### 方案 3：使用浏览器扩展同步 Cookie（不推荐）

可以使用浏览器扩展在 `localhost` 和 `127.0.0.1` 之间同步 Cookie，但这种方法：

- 需要安装第三方扩展
- 可能存在安全风险
- 操作复杂

### 方案 4：修改 hosts 文件（高级）

将 `127.0.0.1` 映射到 `localhost`，但这会影响系统级别的域名解析，不推荐。

## 技术细节

### Cookie 设置代码

当前 Cookie 设置代码（`src/lib/cookies.ts`）：

```typescript
document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`
```

**注意**：没有设置 `domain` 属性，因此 Cookie 绑定到当前域名。

### 为什么不能共享？

即使 `localhost` 和 `127.0.0.1` 指向同一台机器，浏览器仍然将它们视为不同的域名：

- **域名解析**：`localhost` 是主机名，`127.0.0.1` 是 IP 地址
- **Cookie 规范**：Cookie 的 `domain` 属性必须匹配当前域名
- **安全策略**：浏览器不允许跨域共享 Cookie（除非明确设置 `domain`）

### 如果设置 domain 会怎样？

即使设置 `domain=localhost` 或 `domain=127.0.0.1`，也无法让两者共享 Cookie，因为：

1. `localhost` 和 `127.0.0.1` 是不同的域名
2. Cookie 的 `domain` 必须完全匹配当前域名
3. 浏览器安全策略不允许跨域 Cookie

## 最佳实践

### 开发环境

1. **统一使用 `localhost`**：

   ```bash
   # 启动开发服务器
   pnpm run dev

   # 访问地址
   http://localhost:5173
   ```

2. **配置浏览器书签**：
   - 将 `http://localhost:5173` 添加到书签
   - 避免使用 `127.0.0.1`

3. **团队协作**：
   - 在团队文档中明确使用 `localhost`
   - 避免混用两种地址

### 生产环境

生产环境通常使用域名（如 `admin.example.com`），不存在此问题。

## 常见问题

### Q: 为什么 Vite 默认显示 127.0.0.1？

A: Vite 会同时监听 `localhost` 和 `127.0.0.1`，但浏览器地址栏可能显示其中一个。可以手动修改为 `localhost`。

### Q: 能否让两者共享 Cookie？

A: 技术上不可行，因为浏览器安全策略不允许。建议统一使用 `localhost`。

### Q: 如何检查当前使用的是哪个地址？

A: 查看浏览器地址栏，或打开开发者工具 → Application → Cookies，查看域名列。

### Q: 切换地址后需要重新登录吗？

A: 是的，因为 Cookie 是隔离的。建议统一使用 `localhost` 避免此问题。

## 相关文件

- `src/lib/cookies.ts` - Cookie 工具函数
- `src/stores/auth-store.ts` - 认证状态管理（使用 Cookie）
- `src/context/theme-provider.tsx` - 主题设置（使用 Cookie）
- `src/context/font-provider.tsx` - 字体设置（使用 Cookie）

---

**建议**：开发时统一使用 `http://localhost:5173`，避免混用两种地址导致的状态不一致问题。
