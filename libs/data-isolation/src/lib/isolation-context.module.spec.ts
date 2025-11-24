import { describe, expect, it } from '@jest/globals';
import { IsolationContextExecutor } from './isolation-context.executor.js';
import { IsolationContextModule } from './isolation-context.module.js';

describe('IsolationContextModule', () => {
  describe('register', () => {
    it('应返回包含 IsolationContextExecutor 的动态模块', async () => {
      const dynamicModule = IsolationContextModule.register();

      expect(dynamicModule.module).toBe(IsolationContextModule);
      expect(dynamicModule.imports).toHaveLength(1);
      expect(dynamicModule.providers).toContain(IsolationContextExecutor);
      expect(dynamicModule.exports).toContain(IsolationContextExecutor);
    });

    it('应支持自定义 CLS 配置', () => {
      const customOptions = {
        middleware: {
          mount: false,
        },
      };

      const dynamicModule = IsolationContextModule.register(customOptions);

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.imports).toHaveLength(1);
    });

    it('应合并自定义配置与默认配置', () => {
      const customOptions = {
        middleware: {
          mount: false,
        },
      };

      const dynamicModule = IsolationContextModule.register(customOptions);

      expect(dynamicModule).toBeDefined();
      // 验证模块结构
      expect(dynamicModule.module).toBe(IsolationContextModule);
      expect(dynamicModule.providers).toContain(IsolationContextExecutor);
    });
  });
});
