import { HttpStatus } from '@nestjs/common';
import { GeneralUnauthorizedException } from './general-unauthorized.exception.js';

describe('GeneralUnauthorizedException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new GeneralUnauthorizedException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '未授权',
      detail: '认证失败，请重新登录',
      status: HttpStatus.UNAUTHORIZED,
      instance: 'req-1',
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new GeneralUnauthorizedException('Token 已过期');
    const response = exception.toErrorResponse('req-2');

    expect(response.detail).toBe('Token 已过期');
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('应支持自定义 errorCode', () => {
    const exception = new GeneralUnauthorizedException(
      '认证失败',
      'AUTH_FAILED',
    );
    const response = exception.toErrorResponse('req-3');

    expect(response.errorCode).toBe('AUTH_FAILED');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('JWT 解析失败');
    const exception = new GeneralUnauthorizedException(
      'Token 无效',
      'INVALID_TOKEN',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
