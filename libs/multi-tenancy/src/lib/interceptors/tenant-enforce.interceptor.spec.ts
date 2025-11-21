import {
  GeneralForbiddenException,
  GeneralUnauthorizedException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  CallHandler,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { of } from 'rxjs';
import type { TenantClsStore } from '../tenant-cls-store.js';
import { TenantContextExecutor } from '../tenant-context.executor.js';
import {
  SkipTenant,
  TenantEnforceInterceptor,
} from './tenant-enforce.interceptor.js';

describe('TenantEnforceInterceptor', () => {
  let interceptor: TenantEnforceInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let clsService: jest.Mocked<ClsService<TenantClsStore>>;
  let tenantExecutor: jest.Mocked<TenantContextExecutor>;
  let logger: jest.Mocked<InstanceType<typeof Logger>>;
  let context: jest.Mocked<ExecutionContext>;
  let callHandler: jest.Mocked<CallHandler>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    clsService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ClsService<TenantClsStore>>;

    tenantExecutor = {
      getTenantIdOrFail: jest.fn(),
    } as unknown as jest.Mocked<TenantContextExecutor>;

    logger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
    } as unknown as jest.Mocked<InstanceType<typeof Logger>>;

    context = {
      getHandler: jest.fn().mockReturnValue({ name: 'testHandler' }),
      getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    callHandler = {
      handle: jest.fn().mockReturnValue(of('result')),
    } as unknown as jest.Mocked<CallHandler>;

    interceptor = new TenantEnforceInterceptor(
      reflector,
      clsService,
      tenantExecutor,
      logger,
    );
  });

  describe('SkipTenant 装饰器', () => {
    it('应正确设置元数据', () => {
      const decorator = SkipTenant();
      expect(decorator).toBeDefined();
    });
  });

  describe('intercept', () => {
    it('当标记为 SkipTenant 时应跳过拦截', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = interceptor.intercept(context, callHandler);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('skipTenant', [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(logger.warn).toHaveBeenCalledWith('当前请求被标记为跳过租户拦截', {
        controller: 'TestController',
        handler: 'testHandler',
      });
      expect(callHandler.handle).toHaveBeenCalled();
      result.subscribe();
    });

    it('当非 HTTP 请求时应抛出异常', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      context.switchToHttp.mockReturnValue({
        getRequest: jest.fn().mockReturnValue(null),
      } as any);

      expect(() => interceptor.intercept(context, callHandler)).toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '非 HTTP 请求上下文无法解析租户信息',
      );
    });

    it('应从 request.tenantId 获取租户 ID', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = { tenantId: 'tenant-123' };
      context.switchToHttp().getRequest.mockReturnValue(request);
      tenantExecutor.getTenantIdOrFail.mockReturnValue('tenant-123');

      const result = interceptor.intercept(context, callHandler);

      expect(clsService.set).toHaveBeenCalledWith('tenantId', 'tenant-123');
      expect(tenantExecutor.getTenantIdOrFail).toHaveBeenCalled();
      result.subscribe();
    });

    it('应从 x-tenant-id header 获取租户 ID', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = {
        headers: { 'x-tenant-id': 'tenant-456' },
      };
      context.switchToHttp().getRequest.mockReturnValue(request);
      tenantExecutor.getTenantIdOrFail.mockReturnValue('tenant-456');

      const result = interceptor.intercept(context, callHandler);

      expect(clsService.set).toHaveBeenCalledWith('tenantId', 'tenant-456');
      result.subscribe();
    });

    it('应从 request.user.tenantId 获取租户 ID', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = {
        user: { tenantId: 'tenant-789' },
      };
      context.switchToHttp().getRequest.mockReturnValue(request);
      tenantExecutor.getTenantIdOrFail.mockReturnValue('tenant-789');

      const result = interceptor.intercept(context, callHandler);

      expect(clsService.set).toHaveBeenCalledWith('tenantId', 'tenant-789');
      result.subscribe();
    });

    it('当 header 为数组时应取第一个元素', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = {
        headers: { 'x-tenant-id': ['tenant-array-1', 'tenant-array-2'] },
      };
      context.switchToHttp().getRequest.mockReturnValue(request);
      tenantExecutor.getTenantIdOrFail.mockReturnValue('tenant-array-1');

      const result = interceptor.intercept(context, callHandler);

      expect(clsService.set).toHaveBeenCalledWith('tenantId', 'tenant-array-1');
      result.subscribe();
    });

    it('当租户 ID 缺失时应抛出异常', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = {};
      context.switchToHttp().getRequest.mockReturnValue(request);

      expect(() => interceptor.intercept(context, callHandler)).toThrow(
        GeneralUnauthorizedException,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '缺少租户上下文，拒绝继续处理请求',
      );
    });

    it('当租户 ID 为空字符串时应抛出异常', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = { tenantId: '' };
      context.switchToHttp().getRequest.mockReturnValue(request);

      expect(() => interceptor.intercept(context, callHandler)).toThrow(
        GeneralUnauthorizedException,
      );
    });

    it('当租户 ID 为空白字符串时应抛出异常', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = { tenantId: '   ' };
      context.switchToHttp().getRequest.mockReturnValue(request);

      expect(() => interceptor.intercept(context, callHandler)).toThrow(
        GeneralUnauthorizedException,
      );
    });

    it('当租户 ID 类型不是字符串时应抛出异常', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = { tenantId: 123 };
      context.switchToHttp().getRequest.mockReturnValue(request);

      expect(() => interceptor.intercept(context, callHandler)).toThrow(
        GeneralUnauthorizedException,
      );
    });

    it('当检测到跨租户访问时应抛出异常', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = { tenantId: 'tenant-new' };
      context.switchToHttp().getRequest.mockReturnValue(request);
      clsService.get.mockReturnValue('tenant-existing');

      expect(() => interceptor.intercept(context, callHandler)).toThrow(
        GeneralForbiddenException,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '检测到跨租户访问尝试',
        undefined,
        {
          expectedTenantId: 'tenant-existing',
          incomingTenantId: 'tenant-new',
        },
      );
    });

    it('应设置 userId 当 request.user.id 存在时', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = {
        tenantId: 'tenant-999',
        user: { id: 'user-123' },
      };
      context.switchToHttp().getRequest.mockReturnValue(request);
      tenantExecutor.getTenantIdOrFail.mockReturnValue('tenant-999');

      const result = interceptor.intercept(context, callHandler);

      expect(clsService.set).toHaveBeenCalledWith('tenantId', 'tenant-999');
      expect(clsService.set).toHaveBeenCalledWith('userId', 'user-123');
      result.subscribe();
    });

    it('应记录日志当成功注入租户上下文时', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = { tenantId: 'tenant-log' };
      context.switchToHttp().getRequest.mockReturnValue(request);
      tenantExecutor.getTenantIdOrFail.mockReturnValue('tenant-log');

      const result = interceptor.intercept(context, callHandler);

      expect(logger.log).toHaveBeenCalledWith('已注入租户上下文', {
        tenantId: 'tenant-log',
        controller: 'TestController',
        handler: 'testHandler',
      });
      result.subscribe();
    });

    it('应继续执行调用链', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = { tenantId: 'tenant-continue' };
      context.switchToHttp().getRequest.mockReturnValue(request);
      tenantExecutor.getTenantIdOrFail.mockReturnValue('tenant-continue');

      const result = interceptor.intercept(context, callHandler);

      expect(callHandler.handle).toHaveBeenCalled();
      result.subscribe((value) => {
        expect(value).toBe('result');
      });
    });
  });
});
