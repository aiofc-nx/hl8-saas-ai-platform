# @hl8/auth 优化快速参考

## 📊 当前状态概览

- **测试覆盖率**：5.97% ❌（目标：≥80%）
- **代码文件**：20 个源文件
- **测试文件**：3 个（缺少核心守卫测试）
- **总体评分**：7.5/10

---

## 🔴 必须立即修复的问题

### 1. 测试覆盖率严重不足

**缺失的关键测试**：

- ❌ `JwtAuthGuard` - 0% 覆盖率（核心功能）
- ❌ `JwtRefreshGuard` - 0% 覆盖率（核心功能）
- ❌ `AuthModule` - 0% 覆盖率
- ❌ `User` 装饰器 - 0% 覆盖率

**修复步骤**：

```bash
# 1. 创建测试文件
touch src/guards/jwt-auth.guard.spec.ts
touch src/guards/jwt-refresh.guard.spec.ts
touch src/auth.module.spec.ts
touch src/decorators/user.decorator.spec.ts

# 2. 修复现有测试
# public.decorator.spec.ts 和 roles.decorator.spec.ts 需要修复
```

### 2. 类型安全问题

**问题代码**：

```typescript
// ❌ 过度使用 unknown/any
extractUserFromPayload?: (payload: unknown) => unknown;
[key: string]: any;
```

**修复建议**：

```typescript
// ✅ 改进类型
extractUserFromPayload?: <T = IJwtPayload>(payload: IJwtPayload) => T;
// 使用泛型替代索引签名
```

### 3. 代码重复

**重复代码位置**：

- `JwtAuthGuard` 和 `JwtRefreshGuard` 中的令牌提取逻辑

**修复建议**：

```typescript
// 创建 src/utils/token-extractor.ts
export class TokenExtractor {
  static extractFromHeader(request: Request): string | undefined {
    // 统一提取逻辑
  }
}
```

### 4. 硬编码魔法值

**问题位置**：

```typescript
// ❌ RolesGuard 中硬编码
if (user?.role === 'SUPERADMIN') return true;

// ❌ 多个文件中硬编码 'Bearer'
return type === 'Bearer' ? token : undefined;
```

**修复建议**：

```typescript
// ✅ 使用常量
export const BEARER_TOKEN_TYPE = 'Bearer';
export const DEFAULT_SUPER_ADMIN_ROLE = 'SUPERADMIN';
```

---

## 🟡 建议修复的问题

### 5. 安全性增强

**缺少的验证选项**：

- JWT issuer（iss）验证
- JWT audience（aud）验证
- 令牌撤销检查

**修复建议**：

```typescript
export interface AuthConfig {
  accessTokenVerifyOptions?: {
    issuer?: string | string[];
    audience?: string | string[];
  };
}
```

### 6. 依赖声明

**问题**：

```json
// ❌ 当前
"optionalDependencies": {
  "express": "^4.18.0"
}
```

**修复建议**：

```json
// ✅ 改进
"peerDependencies": {
  "@nestjs/jwt": "^10.0.0"
},
"devDependencies": {
  "@types/express": "^4.17.21"
}
```

---

## ✅ 快速修复清单

### 优先级 1（本周完成）

- [ ] 创建 `JwtAuthGuard` 测试文件
- [ ] 创建 `JwtRefreshGuard` 测试文件
- [ ] 修复现有装饰器测试
- [ ] 提取令牌提取器工具类
- [ ] 使用常量替代魔法值

### 优先级 2（下周完成）

- [ ] 改进类型定义（移除 `any`）
- [ ] 添加 JWT 验证选项
- [ ] 调整依赖声明
- [ ] 创建 `AuthModule` 测试

### 优先级 3（下下周完成）

- [ ] 添加工具函数（JwtUtils）
- [ ] 添加配置验证
- [ ] 完善文档
- [ ] 添加认证事件钩子

---

## 📝 代码示例

### 快速修复：令牌提取器

```typescript
// src/utils/token-extractor.ts
import { Request } from 'express';
import { BEARER_TOKEN_TYPE } from '../constants/auth-tokens.constants.js';

export class TokenExtractor {
  static extractFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === BEARER_TOKEN_TYPE ? token : undefined;
  }
}
```

### 快速修复：常量定义

```typescript
// src/constants/auth-tokens.constants.ts
export const BEARER_TOKEN_TYPE = 'Bearer';
export const DEFAULT_SUPER_ADMIN_ROLE = 'SUPERADMIN';
```

### 快速修复：可配置超级管理员

```typescript
// src/interfaces/auth-config.interface.ts
export interface AuthConfig {
  // ...
  superAdminRole?: string; // 默认 'SUPERADMIN'
}
```

---

## 🎯 目标指标

| 指标       | 当前  | 目标 | 状态 |
| ---------- | ----- | ---- | ---- |
| 测试覆盖率 | 5.97% | ≥80% | ❌   |
| 类型安全   | 部分  | 完全 | ⚠️   |
| 代码重复   | 有    | 无   | ⚠️   |
| 安全性     | 基本  | 增强 | ⚠️   |
| 文档完整性 | 良好  | 优秀 | ✅   |

---

## 📚 详细文档

完整评估报告请查看：[EVALUATION_AND_OPTIMIZATION.md](./EVALUATION_AND_OPTIMIZATION.md)
