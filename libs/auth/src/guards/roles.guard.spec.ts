import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/metadata-keys.constants.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let context: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          user: { id: '1', role: 'USER' },
        })),
      })),
    } as unknown as jest.Mocked<ExecutionContext>;

    guard = new RolesGuard(reflector);
  });

  it('应该允许没有角色要求的路由访问', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('应该允许匹配的角色访问', () => {
    reflector.getAllAndOverride.mockReturnValue(['USER', 'ADMIN']);
    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('应该拒绝不匹配的角色访问', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const result = guard.canActivate(context);
    expect(result).toBe(false);
  });

  it('应该允许 SUPERADMIN 访问所有路由', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const superAdminContext = {
      ...context,
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          user: { id: '1', role: 'SUPERADMIN' },
        })),
      })),
    } as unknown as jest.Mocked<ExecutionContext>;
    const result = guard.canActivate(superAdminContext);
    expect(result).toBe(true);
  });

  it('应该从元数据读取角色要求', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    guard.canActivate(context);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
