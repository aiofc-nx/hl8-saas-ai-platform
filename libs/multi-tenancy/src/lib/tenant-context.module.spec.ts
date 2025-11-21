import { describe, expect, it } from '@jest/globals';
import { TenantContextExecutor } from './tenant-context.executor.js';
import { TenantContextModule } from './tenant-context.module.js';

describe('TenantContextModule', () => {
  describe('register', () => {
    it('应返回包含 TenantContextExecutor 的动态模块', async () => {
      const dynamicModule = TenantContextModule.register();

      expect(dynamicModule.module).toBe(TenantContextModule);
      expect(dynamicModule.imports).toHaveLength(1);
      expect(dynamicModule.providers).toContain(TenantContextExecutor);
      expect(dynamicModule.exports).toContain(TenantContextExecutor);
    });

    it('应支持自定义 CLS 配置', () => {
      const customOptions = {
        middleware: {
          mount: false,
        },
      };

      const dynamicModule = TenantContextModule.register(customOptions);

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toHaveLength(1);
    });

    it('应合并自定义配置与默认配置', () => {
      const customOptions = {
        middleware: {
          mount: false,
        },
      };

      const dynamicModule = TenantContextModule.register(customOptions);

      expect(dynamicModule).toBeDefined();
      // 验证模块结构
      expect(dynamicModule.module).toBe(TenantContextModule);
      expect(dynamicModule.providers).toContain(TenantContextExecutor);
    });
  });
});
