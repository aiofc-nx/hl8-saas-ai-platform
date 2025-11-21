import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception.js';

/**
 * @description 测试用的具体异常类
 */
class TestHttpException extends AbstractHttpException<{ testField: string }> {
  constructor(
    title: string,
    detail: string,
    status: HttpStatus,
    data?: { testField: string },
    errorCode?: string,
    rootCause?: unknown,
  ) {
    super(title, detail, status, data, errorCode, rootCause);
  }
}

describe('AbstractHttpException', () => {
  it('应正确设置异常属性', () => {
    const exception = new TestHttpException(
      '测试标题',
      '测试详情',
      HttpStatus.BAD_REQUEST,
      { testField: 'test-value' },
      'TEST_ERROR',
    );

    expect(exception.title).toBe('测试标题');
    expect(exception.detail).toBe('测试详情');
    expect(exception.status).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.data).toEqual({ testField: 'test-value' });
    expect(exception.errorCode).toBe('TEST_ERROR');
    expect(exception.message).toBe('测试详情');
    expect(exception.name).toBe('TestHttpException');
  });

  it('应支持可选的 data 和 errorCode', () => {
    const exception = new TestHttpException(
      '标题',
      '详情',
      HttpStatus.NOT_FOUND,
    );

    expect(exception.data).toBeUndefined();
    expect(exception.errorCode).toBeUndefined();
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('原始错误');
    const exception = new TestHttpException(
      '标题',
      '详情',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      undefined,
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
  });

  describe('toErrorResponse', () => {
    it('应生成符合 RFC7807 的响应', () => {
      const exception = new TestHttpException(
        '测试标题',
        '测试详情',
        HttpStatus.BAD_REQUEST,
        { testField: 'value' },
        'TEST_CODE',
      );

      const response = exception.toErrorResponse('req-123');

      expect(response).toEqual({
        type: 'about:blank',
        title: '测试标题',
        detail: '测试详情',
        status: HttpStatus.BAD_REQUEST,
        instance: 'req-123',
        errorCode: 'TEST_CODE',
        data: { testField: 'value' },
      });
    });

    it('应支持自定义 type', () => {
      const exception = new TestHttpException(
        '标题',
        '详情',
        HttpStatus.NOT_FOUND,
      );

      const response = exception.toErrorResponse(
        'req-456',
        'https://api.example.com/errors/not-found',
      );

      expect(response.type).toBe('https://api.example.com/errors/not-found');
    });

    it('应支持数组类型的 data', () => {
      class ArrayDataException extends AbstractHttpException<{ id: number }[]> {
        constructor() {
          super('标题', '详情', HttpStatus.BAD_REQUEST, [{ id: 1 }, { id: 2 }]);
        }
      }

      const exception = new ArrayDataException();
      const response = exception.toErrorResponse('req-789');

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
    });
  });

  describe('getPresetHeadersValues', () => {
    it('默认应返回空对象', () => {
      const exception = new TestHttpException(
        '标题',
        '详情',
        HttpStatus.BAD_REQUEST,
      );

      expect(exception.getPresetHeadersValues()).toEqual({});
    });

    it('子类可覆盖以提供自定义头部', () => {
      class CustomHeaderException extends AbstractHttpException {
        constructor() {
          super('标题', '详情', HttpStatus.BAD_REQUEST);
        }

        override getPresetHeadersValues(): Record<string, string> {
          return {
            'Retry-After': '60',
            'X-Custom-Header': 'value',
          };
        }
      }

      const exception = new CustomHeaderException();
      const headers = exception.getPresetHeadersValues();

      expect(headers).toEqual({
        'Retry-After': '60',
        'X-Custom-Header': 'value',
      });
    });
  });
});
