import { HttpStatus } from '@nestjs/common';
import { GeneralForbiddenException } from './general-forbidden.exception.js';

describe('GeneralForbiddenException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new GeneralForbiddenException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '禁止访问',
      detail: '当前账户没有执行该操作的权限',
      status: HttpStatus.FORBIDDEN,
      instance: 'req-1',
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new GeneralForbiddenException('自定义权限错误');
    const response = exception.toErrorResponse('req-2');

    expect(response.detail).toBe('自定义权限错误');
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('应支持自定义 errorCode', () => {
    const exception = new GeneralForbiddenException(
      '权限不足',
      'INSUFFICIENT_PERMISSIONS',
    );
    const response = exception.toErrorResponse('req-3');

    expect(response.errorCode).toBe('INSUFFICIENT_PERMISSIONS');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('原始权限错误');
    const exception = new GeneralForbiddenException(
      '权限检查失败',
      'PERMISSION_CHECK_FAILED',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.FORBIDDEN);
  });
});
