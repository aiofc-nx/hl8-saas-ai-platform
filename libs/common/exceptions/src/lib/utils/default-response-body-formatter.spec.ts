import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { GeneralBadRequestException } from '../exceptions/general-bad-request.exception.js';
import { responseBodyFormatter } from './default-response-body-formatter.js';

const createArgumentsHostMock = (
  requestId: string,
  responseHeaders: Record<string, string> = {},
): ArgumentsHost => {
  const httpContext = {
    getRequest: () => ({ requestId }),
    getResponse: () => ({
      header: (key: string, value: string) => {
        responseHeaders[key] = value;
      },
    }),
    getNext: () => undefined,
  };

  return {
    switchToHttp: () =>
      httpContext as unknown as ReturnType<ArgumentsHost['switchToHttp']>,
  } as unknown as ArgumentsHost;
};

describe('responseBodyFormatter', () => {
  it('GeneralBadRequestException 应保持自定义错误码与数据', () => {
    const exception = new GeneralBadRequestException(
      {
        field: 'email',
        message: '邮箱格式不正确',
      },
      '邮箱格式不正确',
      'INVALID_EMAIL',
    );

    const host = createArgumentsHostMock('req-456');

    const formatted = responseBodyFormatter(host, exception, {
      email: '邮箱格式不正确',
    });

    expect(formatted).toMatchObject({
      title: '请求参数错误',
      status: HttpStatus.BAD_REQUEST,
      instance: 'req-456',
      errorCode: 'INVALID_EMAIL',
      data: { email: '邮箱格式不正确' },
    });
  });

  it('Fallback 应处理原生 BadRequestException', () => {
    const exception = new BadRequestException({
      message: 'payload invalid',
      errorCode: 'PAYLOAD_INVALID',
    });

    const host = createArgumentsHostMock('req-789');

    const formatted = responseBodyFormatter(host, exception, {
      payload: 'invalid',
    });

    expect(formatted).toMatchObject({
      title: '请求参数错误',
      status: HttpStatus.BAD_REQUEST,
      detail: 'payload invalid',
      errorCode: 'PAYLOAD_INVALID',
      instance: 'req-789',
      data: { payload: 'invalid' },
    });
  });

  it('应处理数组类型的消息', () => {
    const exception = new BadRequestException({
      message: ['错误1', '错误2'],
    });

    const host = createArgumentsHostMock('req-array');

    const formatted = responseBodyFormatter(host, exception, {
      field1: '错误1',
      field2: '错误2',
    });

    expect(formatted.detail).toBe('错误1; 错误2');
  });

  it('应处理无 errorCode 的 BadRequestException', () => {
    const exception = new BadRequestException('简单错误');

    const host = createArgumentsHostMock('req-simple');

    const formatted = responseBodyFormatter(host, exception, {
      field: 'error',
    });

    expect(formatted).toMatchObject({
      detail: '简单错误',
      errorCode: undefined,
    });
  });

  it('应处理未知异常类型', () => {
    const unknownException = { message: 'unknown' };

    const host = createArgumentsHostMock('req-unknown');

    const formatted = responseBodyFormatter(host, unknownException, {
      error: 'unknown',
    });

    expect(formatted).toMatchObject({
      title: '请求无法处理',
      detail: '无法解析请求体，请稍后重试',
      status: HttpStatus.BAD_REQUEST,
      data: { error: 'unknown' },
    });
  });
});
