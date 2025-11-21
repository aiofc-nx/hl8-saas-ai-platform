import { HttpStatus } from '@nestjs/common';
import { InternalServiceUnavailableException } from './internal-service-unavailable.exception.js';

describe('InternalServiceUnavailableException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new InternalServiceUnavailableException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '内部服务不可用',
      detail: '依赖的内部服务不可用，请稍后重试',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      instance: 'req-1',
    });
    expect(response.data).toEqual({
      service: undefined,
    });
  });

  it('应支持 service 参数', () => {
    const exception = new InternalServiceUnavailableException('payment');
    const response = exception.toErrorResponse('req-2');

    expect(response.data).toEqual({
      service: 'payment',
    });
    expect(response.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('应支持自定义 detail', () => {
    const exception = new InternalServiceUnavailableException(
      'payment',
      '支付服务暂时不可用',
    );
    const response = exception.toErrorResponse('req-3');

    expect(response.detail).toBe('支付服务暂时不可用');
  });

  it('应支持自定义 errorCode', () => {
    const exception = new InternalServiceUnavailableException(
      'notification',
      '通知服务不可用',
      'SERVICE_DOWN',
    );
    const response = exception.toErrorResponse('req-4');

    expect(response.errorCode).toBe('SERVICE_DOWN');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('服务连接超时');
    const exception = new InternalServiceUnavailableException(
      'storage',
      '存储服务不可用',
      'STORAGE_UNAVAILABLE',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
