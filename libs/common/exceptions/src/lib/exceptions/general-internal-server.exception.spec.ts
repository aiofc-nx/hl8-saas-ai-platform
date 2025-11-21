import { HttpStatus } from '@nestjs/common';
import { GeneralInternalServerException } from './general-internal-server.exception.js';

describe('GeneralInternalServerException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new GeneralInternalServerException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '服务器内部错误',
      detail: '服务暂时不可用，请稍后重试',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      instance: 'req-1',
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new GeneralInternalServerException('数据库连接失败');
    const response = exception.toErrorResponse('req-2');

    expect(response.detail).toBe('数据库连接失败');
    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('应支持自定义 errorCode', () => {
    const exception = new GeneralInternalServerException(
      '内部服务异常',
      'INTERNAL_ERROR',
    );
    const response = exception.toErrorResponse('req-3');

    expect(response.errorCode).toBe('INTERNAL_ERROR');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('数据库连接超时');
    const exception = new GeneralInternalServerException(
      '数据库操作失败',
      'DB_ERROR',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
