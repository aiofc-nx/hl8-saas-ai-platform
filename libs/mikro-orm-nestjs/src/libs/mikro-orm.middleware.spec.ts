/**
 * MikroORM 中间件单元测试
 *
 * @description 测试 MikroORM 请求上下文中间件的核心功能
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { MikroOrmMiddleware } from './mikro-orm.middleware.js';

describe('MikroOrmMiddleware', () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    mockCreate = jest.fn((em: unknown, next: (...args: unknown[]) => void) => {
      next();
    }) as jest.Mock;
    jest.spyOn(RequestContext, 'create').mockImplementation(mockCreate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应该创建请求上下文并调用 next', () => {
    const mockEm = {
      fork: jest.fn(() => mockEm),
    };
    const mockOrm = {
      em: mockEm,
    } as unknown as MikroORM;

    const middleware = new MikroOrmMiddleware(mockOrm);
    const next = jest.fn();

    middleware.use({} as unknown, {} as unknown, next);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(mockEm, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
