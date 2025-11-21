import { describe, it, jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { NotFoundExceptionFilter } from './not-found-exception.filter.js';

const createArgumentsHost = (
  request: Record<string, unknown>,
  response: Record<string, unknown>,
): ArgumentsHost =>
  ({
    switchToHttp: () =>
      ({
        getRequest: () => request,
        getResponse: () => response,
        getNext: () => undefined,
      }) as unknown as ReturnType<ArgumentsHost['switchToHttp']>,
  }) as unknown as ArgumentsHost;

describe('NotFoundExceptionFilter', () => {
  const createHttpAdapterHost = (reply: jest.Mock): HttpAdapterHost => {
    return {
      httpAdapter: {
        reply,
      },
    } as unknown as HttpAdapterHost;
  };

  it('应统一输出 404 错误信息', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);

    const logger = {
      warn: jest.fn(),
    };

    const filter = new NotFoundExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof NotFoundExceptionFilter
      >[1],
    );
    const exception = new NotFoundException('资源不存在测试');

    const response = {};
    const host = createArgumentsHost({ id: 'legacy-id' }, response);

    filter.catch(exception, host);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '捕获到 NotFoundException',
        detail: '资源不存在测试',
      }),
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        title: '资源不存在',
        detail: '资源不存在测试',
        instance: 'legacy-id',
      }),
      HttpStatus.NOT_FOUND,
    );
  });

  it('应处理对象类型的异常响应', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = { warn: jest.fn() };

    const filter = new NotFoundExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof NotFoundExceptionFilter
      >[1],
    );
    const exception = new NotFoundException({
      message: '用户不存在',
    });

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-obj' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        detail: '用户不存在',
      }),
      HttpStatus.NOT_FOUND,
    );
  });

  it('应处理数组类型的消息', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = { warn: jest.fn() };

    const filter = new NotFoundExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof NotFoundExceptionFilter
      >[1],
    );
    const exception = new NotFoundException({
      message: ['资源1不存在', '资源2不存在'],
    });

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-array' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        detail: '资源1不存在，资源2不存在',
      }),
      HttpStatus.NOT_FOUND,
    );
  });

  it('应使用默认消息当异常消息无法解析时', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = { warn: jest.fn() };

    const filter = new NotFoundExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof NotFoundExceptionFilter
      >[1],
    );
    // 创建一个 payload 为对象但 message 字段为空数组的异常
    const exception = new NotFoundException({ message: [] });

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-default' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        detail: '请求的资源不存在或已被删除',
      }),
      HttpStatus.NOT_FOUND,
    );
  });

  it('应支持无 Logger 的情况', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);

    const filter = new NotFoundExceptionFilter(httpAdapterHost);
    const exception = new NotFoundException('测试');

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-no-logger' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalled();
  });
});
