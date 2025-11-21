import { HttpStatus } from '@nestjs/common';
import { GeneralNotFoundException } from './general-not-found.exception.js';

describe('GeneralNotFoundException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new GeneralNotFoundException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '资源不存在',
      detail: '请求的资源不存在或已被删除',
      status: HttpStatus.NOT_FOUND,
      instance: 'req-1',
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new GeneralNotFoundException('指定的资源未找到');
    const response = exception.toErrorResponse('req-2');

    expect(response.detail).toBe('指定的资源未找到');
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('应支持自定义 errorCode', () => {
    const exception = new GeneralNotFoundException(
      '资源不存在',
      'RESOURCE_NOT_FOUND',
    );
    const response = exception.toErrorResponse('req-3');

    expect(response.errorCode).toBe('RESOURCE_NOT_FOUND');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('数据库查询失败');
    const exception = new GeneralNotFoundException(
      '资源查询失败',
      'QUERY_FAILED',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.NOT_FOUND);
  });
});
