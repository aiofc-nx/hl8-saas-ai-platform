/**
 * 中间件辅助函数单元测试
 *
 * @description 测试中间件路由路径生成函数
 */

import { describe, expect, it } from '@jest/globals';
import { HttpStatus, type MiddlewareConsumer } from '@nestjs/common';
import { forRoutesPath } from './middleware.helper.js';
import type {
  MikroOrmMiddlewareModuleOptions,
  NestMiddlewareConsumer,
} from './typings.js';

describe('forRoutesPath', () => {
  it('应该返回自定义路径（如果提供）', () => {
    const options: MikroOrmMiddlewareModuleOptions = {
      forRoutesPath: '/api/*',
    };
    const consumer = {} as unknown as MiddlewareConsumer;

    const path = forRoutesPath(options, consumer);
    expect(path).toBe('/api/*');
  });

  it('应该为 NestJS v11 返回 {*all}', () => {
    const options: MikroOrmMiddlewareModuleOptions = {};
    const consumer = {} as unknown as MiddlewareConsumer;

    // 模拟 NestJS v11（有 MULTI_STATUS）
    const originalMultiStatus = HttpStatus.MULTI_STATUS;
    if (!originalMultiStatus) {
      (HttpStatus as { MULTI_STATUS?: number }).MULTI_STATUS = 207;
    }

    const path = forRoutesPath(options, consumer);
    expect(path).toBe('{*all}');

    // 恢复
    if (!originalMultiStatus) {
      delete (HttpStatus as { MULTI_STATUS?: number }).MULTI_STATUS;
    }
  });

  it('应该为 Fastify 返回 (.*)', () => {
    const options: MikroOrmMiddlewareModuleOptions = {};
    const consumer = {
      httpAdapter: {
        constructor: {
          name: 'FastifyAdapter',
        },
      },
    } as unknown as NestMiddlewareConsumer;

    // 确保不是 v11
    const originalMultiStatus = HttpStatus.MULTI_STATUS;
    delete (HttpStatus as { MULTI_STATUS?: number }).MULTI_STATUS;

    const path = forRoutesPath(options, consumer);
    expect(path).toBe('(.*)');

    // 恢复
    if (originalMultiStatus) {
      (HttpStatus as { MULTI_STATUS?: number }).MULTI_STATUS =
        originalMultiStatus;
    }
  });

  it('应该为其他框架返回 *', () => {
    const options: MikroOrmMiddlewareModuleOptions = {};
    const consumer = {
      httpAdapter: {
        constructor: {
          name: 'ExpressAdapter',
        },
      },
    } as unknown as NestMiddlewareConsumer;

    // 确保不是 v11
    const originalMultiStatus = HttpStatus.MULTI_STATUS;
    delete (HttpStatus as { MULTI_STATUS?: number }).MULTI_STATUS;

    const path = forRoutesPath(options, consumer);
    expect(path).toBe('*');

    // 恢复
    if (originalMultiStatus) {
      (HttpStatus as { MULTI_STATUS?: number }).MULTI_STATUS =
        originalMultiStatus;
    }
  });
});
