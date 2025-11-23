import { GeneralUnauthorizedException } from '@hl8/exceptions';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SessionVerifier } from '../interfaces/session-verifier.interface.js';
import { JwtRefreshGuard } from './jwt-refresh.guard.js';

// 定义配置类型，避免运行时导入接口
type TestAuthConfig = {
  accessTokenSecret: string;
  accessTokenExpiration: string | number;
  refreshTokenSecret: string;
  refreshTokenExpiration: string | number;
  extractUserFromPayload?: (payload: unknown) => unknown;
};

describe('JwtRefreshGuard', () => {
  let guard: JwtRefreshGuard;
  let jwtService: jest.Mocked<JwtService>;
  let context: jest.Mocked<ExecutionContext>;
  let config: TestAuthConfig;
  let sessionVerifier: jest.Mocked<SessionVerifier>;

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

    sessionVerifier = {
      verifySession: jest.fn(),
    } as unknown as jest.Mocked<SessionVerifier>;

    context = {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          headers: {
            authorization: 'Bearer refresh-token',
          },
          user: undefined,
        })),
      })),
    } as unknown as jest.Mocked<ExecutionContext>;
  });

  describe('不带会话验证器', () => {
    beforeEach(() => {
      guard = new JwtRefreshGuard(jwtService, config);
    });

    it('应该验证有效的刷新令牌并附加用户到请求', async () => {
      const payload = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const request = {
        headers: {
          authorization: 'Bearer valid-refresh-token',
        },
        user: undefined,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        {
          secret: config.refreshTokenSecret,
        },
      );
      expect(request.user).toEqual(payload);
    });

    it('应该拒绝没有令牌的请求', async () => {
      const request = {
        headers: {},
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await expect(guard.canActivate(context)).rejects.toThrow(
        GeneralUnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        '缺少刷新令牌，请先登录',
      );
    });

    it('应该拒绝无效或过期的刷新令牌', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        GeneralUnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        '刷新令牌无效或已过期',
      );
    });

    it('应该使用自定义用户提取器', async () => {
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
          authorization: 'Bearer valid-refresh-token',
        },
        user: undefined,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      guard = new JwtRefreshGuard(jwtService, config);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(config.extractUserFromPayload).toHaveBeenCalledWith(payload);
      expect(request.user).toEqual(extractedUser);
    });
  });

  describe('带会话验证器', () => {
    beforeEach(() => {
      guard = new JwtRefreshGuard(jwtService, config, sessionVerifier);
    });

    it('应该验证有效的刷新令牌和会话', async () => {
      const payload = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      sessionVerifier.verifySession.mockResolvedValue(true);

      const request = {
        headers: {
          authorization: 'Bearer valid-refresh-token',
        },
        user: payload,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        {
          secret: config.refreshTokenSecret,
        },
      );
      expect(sessionVerifier.verifySession).toHaveBeenCalledWith(
        'valid-refresh-token',
        '1',
      );
    });

    it('应该拒绝会话不存在的刷新令牌', async () => {
      const payload = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      sessionVerifier.verifySession.mockResolvedValue(false);

      const request = {
        headers: {
          authorization: 'Bearer valid-refresh-token',
        },
        user: payload,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await expect(guard.canActivate(context)).rejects.toThrow(
        GeneralUnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        '刷新令牌对应的会话不存在',
      );
      expect(sessionVerifier.verifySession).toHaveBeenCalledWith(
        'valid-refresh-token',
        '1',
      );
    });

    it('应该在令牌验证失败时不调用会话验证器', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        GeneralUnauthorizedException,
      );

      expect(sessionVerifier.verifySession).not.toHaveBeenCalled();
    });

    it('应该正确处理会话验证器抛出异常的情况', async () => {
      const payload = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      sessionVerifier.verifySession.mockRejectedValue(
        new Error('Database error'),
      );

      const request = {
        headers: {
          authorization: 'Bearer valid-refresh-token',
        },
        user: payload,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('令牌提取', () => {
    beforeEach(() => {
      guard = new JwtRefreshGuard(jwtService, config);
    });

    it('应该从请求头正确提取刷新令牌', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: '1' });

      const request = {
        headers: {
          authorization: 'Bearer my-refresh-token-456',
        },
        user: undefined,
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await guard.canActivate(context);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'my-refresh-token-456',
        {
          secret: config.refreshTokenSecret,
        },
      );
    });

    it('应该拒绝无效格式的授权头', async () => {
      const request = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await expect(guard.canActivate(context)).rejects.toThrow(
        GeneralUnauthorizedException,
      );
    });

    it('应该处理缺少授权头的情况', async () => {
      const request = {
        headers: {},
      };
      context.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })) as never;

      await expect(guard.canActivate(context)).rejects.toThrow(
        GeneralUnauthorizedException,
      );
    });
  });
});
