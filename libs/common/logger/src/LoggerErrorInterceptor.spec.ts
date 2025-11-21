import { describe, expect, it, jest } from '@jest/globals';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggerErrorInterceptor } from './LoggerErrorInterceptor.js';

describe('LoggerErrorInterceptor', () => {
  let interceptor: LoggerErrorInterceptor;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockHandler: jest.Mocked<CallHandler>;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new LoggerErrorInterceptor();

    // 创建 mock response（Fastify 格式）
    mockResponse = {
      raw: {},
    };

    // 创建 mock context
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    // 创建 mock handler
    mockHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CallHandler>;
  });

  describe('intercept', () => {
    it('应正常传递成功的请求', (done) => {
      const data = { success: true };
      mockHandler.handle.mockReturnValue(of(data));

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (value) => {
          expect(value).toBe(data);
          expect(mockResponse.raw.err).toBeUndefined();
          expect(mockResponse.err).toBeUndefined();
          done();
        },
      });
    });

    it('应捕获错误并绑定到 Fastify 响应对象', (done) => {
      const error = new Error('测试错误');
      mockHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(mockResponse.raw.err).toBe(error);
          done();
        },
      });
    });

    it('应捕获错误并绑定到 Express 响应对象', (done) => {
      // Express 格式的响应对象（没有 raw 属性）
      const expressResponse = {};
      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(expressResponse),
      }) as any;

      const error = new Error('Express 错误');
      mockHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect((expressResponse as any).err).toBe(error);
          done();
        },
      });
    });

    it('应保持错误传播', (done) => {
      const error = new Error('应传播的错误');
      mockHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('应处理多个错误', (done) => {
      const error1 = new Error('错误1');
      const error2 = new Error('错误2');

      let callCount = 0;
      mockHandler.handle
        .mockReturnValueOnce(throwError(() => error1))
        .mockReturnValueOnce(throwError(() => error2));

      const checkError = (err: Error, expected: Error) => {
        expect(err).toBe(expected);
        callCount++;
        if (callCount === 2) {
          done();
        }
      };

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: (err) => checkError(err, error1),
      });

      // 第二次调用
      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: (err) => checkError(err, error2),
      });
    });
  });
});
