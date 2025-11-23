import { describe, expect, it, jest } from '@jest/globals';
import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module.js';
import { AUTH_CONFIG } from './constants/auth-tokens.constants.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

// 定义配置类型，避免运行时导入接口
type TestAuthConfig = {
  accessTokenSecret: string;
  accessTokenExpiration: string | number;
  refreshTokenSecret: string;
  refreshTokenExpiration: string | number;
  extractUserFromPayload?: (payload: unknown) => unknown;
};

describe('AuthModule', () => {
  const mockConfig: TestAuthConfig = {
    accessTokenSecret: 'test-access-secret',
    accessTokenExpiration: '15m',
    refreshTokenSecret: 'test-refresh-secret',
    refreshTokenExpiration: '7d',
  };

  describe('forRoot', () => {
    it('应该创建动态模块并注册配置提供者', () => {
      const module: DynamicModule = AuthModule.forRoot(mockConfig);

      expect(module.module).toBe(AuthModule);
      expect(module.providers).toHaveLength(4); // config + 3 guards
      expect(module.exports).toContain(JwtAuthGuard);
      expect(module.exports).toContain(JwtRefreshGuard);
      expect(module.exports).toContain(RolesGuard);
      expect(module.exports).toContain(AUTH_CONFIG);
      expect(module.global).toBe(false);

      // 验证配置提供者
      const configProvider = module.providers?.find(
        (p) => (p as { provide?: unknown }).provide === AUTH_CONFIG,
      );
      expect(configProvider).toBeDefined();
      expect(
        (configProvider as { useValue?: TestAuthConfig })?.useValue,
      ).toEqual(mockConfig);
    });

    it('应该导出守卫供其他模块使用', () => {
      const module: DynamicModule = AuthModule.forRoot(mockConfig);

      expect(module.exports).toContain(JwtAuthGuard);
      expect(module.exports).toContain(JwtRefreshGuard);
      expect(module.exports).toContain(RolesGuard);
    });

    it('应该提供配置令牌', () => {
      const module: DynamicModule = AuthModule.forRoot(mockConfig);

      expect(module.exports).toContain(AUTH_CONFIG);
    });
  });

  describe('forRootAsync', () => {
    it('应该创建异步动态模块', () => {
      const useFactory = jest.fn(() => mockConfig);
      const module: DynamicModule = AuthModule.forRootAsync({
        useFactory,
      });

      expect(module.module).toBe(AuthModule);
      expect(module.providers).toHaveLength(4); // config + 3 guards
      expect(module.exports).toContain(JwtAuthGuard);
      expect(module.exports).toContain(JwtRefreshGuard);
      expect(module.exports).toContain(RolesGuard);
      expect(module.exports).toContain(AUTH_CONFIG);
      expect(module.global).toBe(false);

      // 验证配置提供者
      const configProvider = module.providers?.find(
        (p) => (p as { provide?: unknown }).provide === AUTH_CONFIG,
      );
      expect(configProvider).toBeDefined();
      expect(
        (configProvider as { useFactory?: () => TestAuthConfig })?.useFactory,
      ).toBe(useFactory);
    });

    it('应该支持注入依赖', () => {
      const useFactory = jest.fn(
        (configService: ConfigService) =>
          ({
            accessTokenSecret: configService.get('ACCESS_TOKEN_SECRET'),
            accessTokenExpiration: '15m',
            refreshTokenSecret: configService.get('REFRESH_TOKEN_SECRET'),
            refreshTokenExpiration: '7d',
          }) as TestAuthConfig,
      );

      const module: DynamicModule = AuthModule.forRootAsync({
        imports: [ConfigModule],
        useFactory,
        inject: [ConfigService],
      });

      expect(module.imports).toContain(ConfigModule);
      expect(module.providers).toBeDefined();

      const configProvider = module.providers?.find(
        (p) => (p as { provide?: unknown }).provide === AUTH_CONFIG,
      );
      const inject = (configProvider as { inject?: unknown[] })?.inject;
      expect(inject).toEqual([ConfigService]);
    });

    it('应该在没有注入依赖时使用空数组', () => {
      const useFactory = jest.fn(() => mockConfig);

      const module: DynamicModule = AuthModule.forRootAsync({
        useFactory,
      });

      const configProvider = module.providers?.find(
        (p) => (p as { provide?: unknown }).provide === AUTH_CONFIG,
      );
      const inject = (configProvider as { inject?: unknown[] })?.inject;
      expect(inject).toEqual([]);
    });

    it('应该在没有导入时使用空数组', () => {
      const useFactory = jest.fn(() => mockConfig);

      const module: DynamicModule = AuthModule.forRootAsync({
        useFactory,
      });

      expect(module.imports).toEqual([]);
    });

    it('应该支持异步工厂函数', async () => {
      const useFactory = jest.fn(
        async () =>
          new Promise<TestAuthConfig>((resolve) => {
            setTimeout(() => resolve(mockConfig), 10);
          }),
      );

      const module: DynamicModule = AuthModule.forRootAsync({
        useFactory,
      });

      expect(module).toBeDefined();
      const configProvider = module.providers?.find(
        (p) => (p as { provide?: unknown }).provide === AUTH_CONFIG,
      );
      expect(configProvider).toBeDefined();

      // 验证工厂函数可以被调用并返回 Promise
      const factory = (
        configProvider as { useFactory?: () => Promise<TestAuthConfig> }
      )?.useFactory;
      if (factory) {
        const result = await factory();
        expect(result).toEqual(mockConfig);
      }
    });

    it('应该导出所有守卫和配置令牌', () => {
      const useFactory = jest.fn(() => mockConfig);

      const module: DynamicModule = AuthModule.forRootAsync({
        useFactory,
      });

      expect(module.exports).toContain(JwtAuthGuard);
      expect(module.exports).toContain(JwtRefreshGuard);
      expect(module.exports).toContain(RolesGuard);
      expect(module.exports).toContain(AUTH_CONFIG);
    });
  });

  describe('模块配置', () => {
    it('应该是非全局模块', () => {
      const syncModule: DynamicModule = AuthModule.forRoot(mockConfig);
      expect(syncModule.global).toBe(false);

      const asyncModule: DynamicModule = AuthModule.forRootAsync({
        useFactory: () => mockConfig,
      });
      expect(asyncModule.global).toBe(false);
    });

    it('应该提供所有必需的守卫', () => {
      const module: DynamicModule = AuthModule.forRoot(mockConfig);

      // providers 中可能包含函数或对象，我们需要检查守卫是否存在
      expect(module.providers).toContain(JwtAuthGuard);
      expect(module.providers).toContain(JwtRefreshGuard);
      expect(module.providers).toContain(RolesGuard);
    });
  });
});
