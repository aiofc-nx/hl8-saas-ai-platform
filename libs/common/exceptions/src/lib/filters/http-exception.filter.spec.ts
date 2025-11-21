import { describe, it, jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { GeneralForbiddenException } from '../exceptions/general-forbidden.exception.js';
import { GeneralInternalServerException } from '../exceptions/general-internal-server.exception.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

const createArgumentsHost = (
  request: Record<string, unknown>,
  response: Record<string, unknown> & { header?: jest.Mock },
): ArgumentsHost =>
  ({
    switchToHttp: () =>
      ({
        getRequest: () => request,
        getResponse: () => response,
        getNext: () => undefined,
      }) as unknown as ReturnType<ArgumentsHost['switchToHttp']>,
  }) as unknown as ArgumentsHost;

describe('HttpExceptionFilter', () => {
  const createHttpAdapterHost = (reply: jest.Mock): HttpAdapterHost => {
    return {
      httpAdapter: {
        reply,
      },
    } as unknown as HttpAdapterHost;
  };

  it('500 级别异常应记录错误日志并返回 RFC 格式', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = {
      error: jest.fn(),
      warn: jest.fn(),
    };

    const filter = new HttpExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<typeof HttpExceptionFilter>[1],
    );
    const exception = new GeneralInternalServerException(
      '服务暂时不可用',
      'INTERNAL_ERROR',
    );

    const response = { header: jest.fn() };
    const host = createArgumentsHost({ requestId: 'req-500' }, response);

    filter.catch(exception, host);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '捕获到内部异常',
        exceptionName: exception.name,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId: 'req-500',
      }),
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        instance: 'req-500',
        detail: '服务暂时不可用',
        errorCode: 'INTERNAL_ERROR',
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('业务异常应记录告警日志', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const logger = {
      error: jest.fn(),
      warn: jest.fn(),
    };

    const filter = new HttpExceptionFilter(
      httpAdapterHost,
      logger as unknown as ConstructorParameters<typeof HttpExceptionFilter>[1],
    );
    const exception = new GeneralForbiddenException(
      '当前账户没有权限',
      'NO_AUTH',
    );

    const response = { header: jest.fn() };
    const host = createArgumentsHost({ requestId: 'req-403' }, response);

    filter.catch(exception, host);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '捕获到业务异常',
        status: HttpStatus.FORBIDDEN,
        requestId: 'req-403',
        errorCode: 'NO_AUTH',
      }),
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        status: HttpStatus.FORBIDDEN,
        detail: '当前账户没有权限',
        instance: 'req-403',
      }),
      HttpStatus.FORBIDDEN,
    );
  });

  it('应应用预设响应头', () => {
    class CustomHeaderException extends GeneralForbiddenException {
      override getPresetHeadersValues(): Record<string, string> {
        return {
          'Retry-After': '60',
          'X-Custom': 'value',
        };
      }
    }

    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const filter = new HttpExceptionFilter(httpAdapterHost);

    const exception = new CustomHeaderException();
    const response = { header: jest.fn() };
    const host = createArgumentsHost({ requestId: 'req-headers' }, response);

    filter.catch(exception, host);

    expect(response.header).toHaveBeenCalledWith('Retry-After', '60');
    expect(response.header).toHaveBeenCalledWith('X-Custom', 'value');
  });

  it('应处理无 header 方法的响应对象', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const filter = new HttpExceptionFilter(httpAdapterHost);

    class CustomHeaderException extends GeneralForbiddenException {
      override getPresetHeadersValues(): Record<string, string> {
        return { 'X-Test': 'value' };
      }
    }

    const exception = new CustomHeaderException();
    const response = {}; // 无 header 方法
    const host = createArgumentsHost({ requestId: 'req-no-header' }, response);

    expect(() => filter.catch(exception, host)).not.toThrow();
    expect(reply).toHaveBeenCalled();
  });

  it('应支持无 Logger 的情况', () => {
    const reply = jest.fn();
    const httpAdapterHost = createHttpAdapterHost(reply);
    const filter = new HttpExceptionFilter(httpAdapterHost);

    const exception = new GeneralForbiddenException('测试');
    const response = { header: jest.fn() };
    const host = createArgumentsHost({ requestId: 'req-no-logger' }, response);

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalled();
  });
});
