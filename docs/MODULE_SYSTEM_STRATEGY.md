# 模块系统策略文档

## 概述

本文档详细说明了 hl8-saas-ai-platform 项目在 monorepo 环境下的模块系统策略。我们采用了一种**混合模块系统策略**：**libs 目录下的库都服务于 NestJS 项目，因此统一编译为 CommonJS**，而前端应用使用 ESM。这种策略确保了与 NestJS 框架的完全兼容性。

## 核心原则

### 1. 统一 TypeScript 配置

所有项目（库、NestJS 应用、前端应用）都使用 **NodeNext** 模块系统进行类型检查：

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "target": "ESNext",
    "strict": true
  }
}
```

**好处**：

- ✅ 提前发现模块解析问题（在类型检查阶段，而非运行时）
- ✅ 更严格的 ESM/CommonJS 互操作性检查
- ✅ 模拟 Node.js 实际模块解析行为
- ✅ 为未来迁移到 ESM 做好准备
- ✅ 更好的 IDE 支持和类型推断

### 2. 区分项目类型的运行时配置

虽然所有项目都使用 `NodeNext` 进行类型检查，但不同项目类型有不同的运行时配置：

| 项目类型                       | `package.json` 的 `type`  | 编译输出 | 运行时格式                |
| ------------------------------ | ------------------------- | -------- | ------------------------- |
| **库项目（libs/**）\*\*        | **禁止** `type: "module"` | CommonJS | CommonJS（服务于 NestJS） |
| **NestJS 应用（apps/\*-api）** | **禁止** `type: "module"` | CommonJS | CommonJS                  |
| **前端应用（apps/web）**       | `"module"`                | ESM      | ESM                       |

## 详细配置

### 一、库项目（libs/\*\*）

#### 1.1 package.json 配置

```json
{
  "name": "@hl8/config",
  "version": "1.0.0",
  "description": "类型安全的配置管理模块",
  "engines": {
    "node": ">=20"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

**关键点**：

- ❌ **禁止**声明 `"type": "module"`（库服务于 NestJS，需要 CommonJS）
- ✅ 必须声明 `"engines": { "node": ">=20" }`
- ✅ `exports` 字段必须同时提供 `import` 和 `require` 条件（虽然编译为 CommonJS，但提供 `import` 条件可提升兼容性，允许 ESM 项目也能使用）
- ✅ `main` 字段指向编译后的 CommonJS 文件

#### 1.2 TypeScript 配置

**tsconfig.json**（类型检查）：

```json
{
  "extends": "@repo/ts-config/nestjs.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "target": "ESNext",
    "strict": true
  }
}
```

**tsconfig.build.json**（编译配置）：

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/tsconfig.build.tsbuildinfo",
    "module": "CommonJS",
    "moduleResolution": "node"
  },
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts", "jest.config.ts"]
}
```

**关键点**：

- ✅ **必须明确指定** `module: "CommonJS"` 和 `moduleResolution: "node"`
- ✅ 这会覆盖 `tsconfig.json` 中的 `NodeNext` 设置，强制编译为 CommonJS
- ✅ 即使 `package.json` 有 `type: "module"`，也会编译为 CommonJS（但我们已经移除了它）

**编译输出**：CommonJS 格式（`"use strict"` 和 `require`/`module.exports`）

#### 1.3 代码示例

**源文件（src/index.ts）**：

```typescript
// ✅ 相对路径导入必须包含 .js 扩展名（NodeNext 类型检查要求）
export * from './libs/mikro-orm.common.js';
export * from './libs/mikro-orm.middleware.js';
```

**编译输出（dist/index.js）**：

```javascript
'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
__exportStar(require('./libs/mikro-orm.common.js'), exports);
__exportStar(require('./libs/mikro-orm.middleware.js'), exports);
```

#### 1.4 为什么库编译为 CommonJS？

**核心原因**：libs 目录下的所有库都**专门服务于 NestJS 项目**：

1. **NestJS 运行时要求**：NestJS 框架的依赖注入、装饰器元数据等核心功能依赖 CommonJS
2. **统一性**：所有库编译为 CommonJS，确保与 NestJS 应用的完全兼容
3. **简化配置**：不需要处理 ESM/CommonJS 互操作性问题
4. **性能**：CommonJS 在 Node.js 中的加载性能已经足够好

虽然源文件使用 ESM 语法（`export * from ...`），但编译输出统一为 CommonJS 格式，这样可以直接被 NestJS 应用使用。

### 二、NestJS 应用（apps/\*-api）

#### 2.1 package.json 配置

```json
{
  "name": "iam-api",
  "version": "1.0.0",
  "private": true
  // ⚠️ 注意：禁止声明 "type": "module"
}
```

**关键点**：

- ❌ **禁止**声明 `"type": "module"`
- ✅ 运行时必须使用 CommonJS（NestJS 框架要求）

#### 2.2 TypeScript 配置

**tsconfig.json**（类型检查）：

```json
{
  "extends": "@repo/ts-config/nestjs.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "target": "ESNext",
    "strict": true
  }
}
```

**nest-cli.json**（编译配置）：

```json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

**关键点**：

- ✅ TypeScript 配置使用 `NodeNext` **仅用于类型检查**
- ✅ 实际编译由 **SWC** 处理，输出为 **CommonJS**
- ✅ SWC 会忽略 `tsconfig.json` 的 `module` 设置，直接输出 CommonJS

#### 2.3 代码示例

**源文件（src/database/database.module.ts）**：

```typescript
// ✅ 包导入不需要扩展名（NodeNext 理解 package.json 的 exports）
import { MikroOrmModule } from '@hl8/mikro-orm-nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
```

**编译输出（dist/database/database.module.js）**：

```javascript
'use strict';
const _mikro_orm_nestjs = require('@hl8/mikro-orm-nestjs');
const _postgresql = require('@mikro-orm/postgresql');
const common_1 = require('@nestjs/common');
```

#### 2.4 为什么 NestJS 应用不能使用 `type: "module"`？

1. **框架限制**：NestJS 的依赖注入系统、装饰器元数据等核心功能依赖 CommonJS
2. **运行时要求**：NestJS 的模块加载机制需要 CommonJS 的 `require()` 和 `module.exports`
3. **兼容性**：大量 NestJS 生态系统包（如 `@nestjs/core`、`@nestjs/common`）都是 CommonJS

#### 2.5 为什么 TypeScript 配置使用 `NodeNext`？

虽然运行时是 CommonJS，但 `NodeNext` 的类型检查能带来：

1. **提前发现问题**：在类型检查阶段发现模块解析错误
2. **验证库的兼容性**：确保从 ESM 库导入的类型正确
3. **为未来做准备**：如果 NestJS 将来支持 ESM，代码已经准备好了

### 三、前端应用（apps/web）

#### 3.1 package.json 配置

```json
{
  "name": "web",
  "type": "module",
  "engines": {
    "node": ">=20"
  }
}
```

**关键点**：

- ✅ 必须声明 `"type": "module"`
- ✅ Next.js 15+ 完全支持 ESM

#### 3.2 TypeScript 配置

**tsconfig.json**：

```json
{
  "extends": "@repo/ts-config/nextjs.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
```

**关键点**：

- ✅ Next.js 使用自己的模块解析（`Bundler`）
- ✅ 编译输出由 Next.js 的构建工具处理

## 常见问题

### Q1: 为什么库项目编译为 CommonJS 而不是 ESM？

**A**: 因为 libs 目录下的所有库都**专门服务于 NestJS 项目**：

- NestJS 运行时需要 CommonJS（依赖注入、装饰器元数据等）
- 统一编译为 CommonJS 确保与 NestJS 应用的完全兼容
- 简化配置，不需要处理 ESM/CommonJS 互操作性问题
- 如果将来需要支持前端应用，可以考虑创建单独的 `packages` 目录下的 ESM 库

### Q2: 为什么 NestJS 应用不能使用 `type: "module"`？

**A**: NestJS 框架的核心功能（依赖注入、装饰器元数据、模块系统）都依赖 CommonJS。如果强制使用 ESM，会导致：

- ❌ 依赖注入系统无法正常工作
- ❌ 装饰器元数据无法正确反射
- ❌ 模块加载失败

### Q3: 如果将来 NestJS 支持 ESM，我们的代码需要修改吗？

**A**: 需要修改编译配置：

- ✅ 库代码的源文件已经符合 ESM 规范（显式扩展名）
- ✅ 应用代码的类型检查已经验证了 ESM 兼容性
- ✅ 需要修改 `tsconfig.build.json` 中的 `module` 为 `NodeNext` 或 `ESNext`
- ✅ 需要修改 `package.json` 添加 `type: "module"`
- ✅ 需要重新编译所有库

### Q4: `NodeNext` 类型检查会带来性能问题吗？

**A**: 不会：

- ✅ 类型检查只在开发阶段进行
- ✅ 实际编译由 SWC 处理，速度很快
- ✅ 类型检查的额外开销可以忽略不计

### Q5: 如何验证配置是否正确？

**A**: 运行以下命令：

```bash
# 库项目
cd libs/common/config
pnpm build
pnpm type-check

# NestJS 应用
cd apps/iam-api
pnpm build
pnpm start  # 验证运行时是否正常

# 前端应用
cd apps/web
pnpm build
pnpm start
```

## 最佳实践

### 1. 库项目

✅ **推荐**：

- **禁止**声明 `type: "module"`（库服务于 NestJS，需要 CommonJS）
- 在 `tsconfig.build.json` 中明确指定 `module: "CommonJS"` 和 `moduleResolution: "node"`
- 相对路径导入必须包含 `.js` 扩展名（NodeNext 类型检查要求）
- `exports` 字段只需提供 `require` 条件

❌ **避免**：

- 不要声明 `type: "module"`（会导致编译输出不一致）
- 不要在 `tsconfig.build.json` 中省略 `module` 配置（必须明确指定 CommonJS）
- 不要使用 `.ts` 扩展名（运行时不存在）

### 2. NestJS 应用

✅ **推荐**：

- 使用 `NodeNext` 进行类型检查
- 使用 SWC 进行编译（输出 CommonJS）
- 包导入不需要扩展名

❌ **避免**：

- 不要声明 `type: "module"`
- 不要在应用代码中使用相对路径的 `.js` 扩展名（除非必要）

### 3. 前端应用

✅ **推荐**：

- 使用 `type: "module"`
- 使用 Next.js 的模块解析配置

## 总结

我们的模块系统策略通过以下方式实现了**统一性与兼容性的平衡**：

1. **统一类型检查**：所有项目使用 `NodeNext` 进行严格的类型检查
2. **统一运行时**：库和 NestJS 应用都使用 CommonJS，前端应用使用 ESM
3. **明确配置**：库的 `tsconfig.build.json` 明确指定 `module: "CommonJS"`，确保编译输出一致
4. **未来兼容**：源文件使用 ESM 语法，类型检查使用 NodeNext，为未来迁移做好准备

这种策略既保证了：

- ✅ 与 NestJS 框架的完全兼容性（CommonJS）
- ✅ 类型安全（NodeNext 严格检查）
- ✅ 配置明确（编译输出格式明确指定）
- ✅ 未来可扩展性（源文件已符合 ESM 规范，易于迁移）

## 参考资源

- [TypeScript NodeNext 模块系统](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext)
- [Node.js Package Exports](https://nodejs.org/api/packages.html#exports)
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Next.js ESM 支持](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
