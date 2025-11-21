import { describe, it, jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { ForbiddenException, HttpStatus } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { ForbiddenExceptionFilter } from './forbidden-exception.filter.js';

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

describe('ForbiddenExceptionFilter', () => {
  const createHttpAdapterHost = (reply: jest.Mock): HttpAdapterHost => {
    return {
      httpAdapter: {
        reply,
      },
    } as unknown as HttpAdapterHost;
  };

  it('应将异常转换为统一格式并记录告警', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);

    const logger = {
      warn: jest.fn(),
    };

    const filter = new ForbiddenExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof ForbiddenExceptionFilter
      >[1],
    );
    const exception = new ForbiddenException('禁止访问测试');

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-403' }, response);

    filter.catch(exception, host);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '捕获到 ForbiddenException',
        instance: 'req-403',
        detail: '禁止访问测试',
      }),
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        status: HttpStatus.FORBIDDEN,
        detail: '禁止访问测试',
        title: '禁止访问',
        instance: 'req-403',
      }),
      HttpStatus.FORBIDDEN,
    );
  });

  it('应处理对象类型的异常响应', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = { warn: jest.fn() };

    const filter = new ForbiddenExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof ForbiddenExceptionFilter
      >[1],
    );
    const exception = new ForbiddenException({
      message: '权限不足',
    });

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-obj' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        detail: '权限不足',
      }),
      HttpStatus.FORBIDDEN,
    );
  });

  it('应处理数组类型的消息', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = { warn: jest.fn() };

    const filter = new ForbiddenExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof ForbiddenExceptionFilter
      >[1],
    );
    const exception = new ForbiddenException({
      message: ['错误1', '错误2'],
    });

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-array' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        detail: '错误1，错误2',
      }),
      HttpStatus.FORBIDDEN,
    );
  });

  it('应使用默认消息当异常消息无法解析时', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = { warn: jest.fn() };

    const filter = new ForbiddenExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<
        typeof ForbiddenExceptionFilter
      >[1],
    );
    // 创建一个 payload 为对象但 message 字段为空数组的异常
    const exception = new ForbiddenException({ message: [] });

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-default' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        detail: '当前账户没有执行该操作的权限',
      }),
      HttpStatus.FORBIDDEN,
    );
  });

  it('应支持无 Logger 的情况', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);

    const filter = new ForbiddenExceptionFilter(httpAdapterHost);
    const exception = new ForbiddenException('测试');

    const response = {};
    const host = createArgumentsHost({ requestId: 'req-no-logger' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalled();
  });
});
