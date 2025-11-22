import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../constants/metadata-keys.constants.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// Mock @hl8/exceptions - 确保 mock 在导入之前
jest.mock('@hl8/exceptions', () => {
  class GeneralUnauthorizedException extends Error {
    constructor(
      message: string,
      public code: string,
    ) {
      super(message);
      this.name = 'GeneralUnauthorizedException';
    }
  }
  return { GeneralUnauthorizedException };
});

// 定义配置类型，避免运行时导入接口
type TestAuthConfig = {
  accessTokenSecret: string;
  accessTokenExpiration: string | number;
  refreshTokenSecret: string;
  refreshTokenExpiration: string | number;
  extractUserFromPayload?: (payload: unknown) => unknown;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;
  let context: jest.Mocked<ExecutionContext>;
  let config: TestAuthConfig;

  beforeEach(() => {
    config = {
      accessTokenSecret: 'test-secret',
      accessTokenExpiration: '15m',
      refreshTokenSecret: 'refresh-secret',
      refreshTokenExpiration: '7d',
    };

    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          headers: {
            authorization: 'Bearer test-token',
          },
          user: undefined,
        })),
      })),
    } as unknown as jest.Mocked<ExecutionContext>;

    guard = new JwtAuthGuard(jwtService, reflector, config);
  });

  describe('canActivate', () => {
    it('应该允许访问标记为公共的路由', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('应该拒绝没有令牌的请求', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = {
        headers: {},
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await expect(guard.canActivate(context)).rejects.toThrow(Error);
      await expect(guard.canActivate(context)).rejects.toThrow(
        '缺少访问令牌，请先登录',
      );
    });

    it('应该拒绝无效格式的授权头', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await expect(guard.canActivate(context)).rejects.toThrow(Error);
    });

    it('应该验证有效的令牌并附加用户到请求', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const payload = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const request = {
        headers: {
          authorization: 'Bearer valid-token',
        },
        user: undefined,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: config.accessTokenSecret,
      });
      expect(request.user).toEqual(payload);
    });

    it('应该使用自定义用户提取器', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const payload = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'ADMIN',
      };
      const extractedUser = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
      };

      config.extractUserFromPayload = jest.fn(() => extractedUser);
      jwtService.verifyAsync.mockResolvedValue(payload);

      const request = {
        headers: {
          authorization: 'Bearer valid-token',
        },
        user: undefined,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(config.extractUserFromPayload).toHaveBeenCalledWith(payload);
      expect(request.user).toEqual(extractedUser);
    });

    it('应该拒绝无效或过期的令牌', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(Error);
      await expect(guard.canActivate(context)).rejects.toThrow(
        '访问令牌无效或已过期',
      );
    });

    it('应该拒绝签名无效的令牌', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));

      await expect(guard.canActivate(context)).rejects.toThrow(Error);
      await expect(guard.canActivate(context)).rejects.toThrow(
        '访问令牌无效或已过期',
      );
    });

    it('应该从请求头正确提取令牌', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue({ id: '1' });

      const request = {
        headers: {
          authorization: 'Bearer my-test-token-123',
        },
        user: undefined,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await guard.canActivate(context);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('my-test-token-123', {
        secret: config.accessTokenSecret,
      });
    });
  });
});
