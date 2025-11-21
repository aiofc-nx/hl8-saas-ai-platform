import { describe, it, jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { AnyExceptionFilter } from './any-exception.filter.js';

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

describe('AnyExceptionFilter', () => {
  const createHttpAdapterHost = (reply: jest.Mock): HttpAdapterHost => {
    return {
      httpAdapter: {
        reply,
      },
    } as unknown as HttpAdapterHost;
  };

  it('ServiceUnavailableException 应直接透传响应', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const filter = new AnyExceptionFilter(httpAdapterHost);

    const exception = new ServiceUnavailableException('service down');
    const response = {};
    const host = createArgumentsHost({ requestId: 'req-503' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      exception.getResponse(),
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  });

  it('未知异常应记录错误并返回通用 500', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = {
      error: jest.fn(),
    };

    const filter = new AnyExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<typeof AnyExceptionFilter>[1],
    );

    const error = new Error('boom');
    const response = {};
    const host = createArgumentsHost({ requestId: 'req-500' }, response);

    filter.catch(error, host);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '捕获到未处理异常',
        instance: 'req-500',
        exception: error,
      }),
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: '系统繁忙，请稍后重试',
        instance: 'req-500',
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('应支持无 Logger 的情况', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const filter = new AnyExceptionFilter(httpAdapterHost);

    const error = new Error('test');
    const response = {};
    const host = createArgumentsHost({ requestId: 'req-no-logger' }, response);

    // 应该使用 console.error 作为后备
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    filter.catch(error, host);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[AnyExceptionFilter] 捕获到未处理异常',
      error,
    );
    expect(reply).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('应处理非 Error 类型的异常', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = { error: jest.fn() };

    const filter = new AnyExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<typeof AnyExceptionFilter>[1],
    );

    const weirdError = { message: 'weird error' };
    const response = {};
    const host = createArgumentsHost({ requestId: 'req-weird' }, response);

    filter.catch(weirdError, host);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        exception: weirdError,
      }),
    );
    expect(reply).toHaveBeenCalled();
  });
});
