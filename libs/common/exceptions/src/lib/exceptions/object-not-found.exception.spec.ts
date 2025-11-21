import { HttpStatus } from '@nestjs/common';
import { ObjectNotFoundException } from './object-not-found.exception.js';

describe('ObjectNotFoundException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new ObjectNotFoundException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '资源不存在',
      detail: '目标资源不存在',
      status: HttpStatus.NOT_FOUND,
      instance: 'req-1',
    });
    expect(response.data).toEqual({
      resourceType: undefined,
      identifier: undefined,
    });
  });

  it('应支持 resourceType 和 identifier', () => {
    const exception = new ObjectNotFoundException('User', 'user-123');
    const response = exception.toErrorResponse('req-2');

    expect(response.data).toEqual({
      resourceType: 'User',
      identifier: 'user-123',
    });
  });

  it('应支持数字类型的 identifier', () => {
    const exception = new ObjectNotFoundException('Order', 456);
    const response = exception.toErrorResponse('req-3');

    expect(response.data).toEqual({
      resourceType: 'Order',
      identifier: 456,
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new ObjectNotFoundException(
      'Product',
      'prod-789',
      '商品不存在或已下架',
    );
    const response = exception.toErrorResponse('req-4');

    expect(response.detail).toBe('商品不存在或已下架');
  });

  it('应支持自定义 errorCode', () => {
    const exception = new ObjectNotFoundException(
      'User',
      'user-001',
      '用户不存在',
      'USER_NOT_FOUND',
    );
    const response = exception.toErrorResponse('req-5');

    expect(response.errorCode).toBe('USER_NOT_FOUND');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('数据库查询返回空');
    const exception = new ObjectNotFoundException(
      'Order',
      'order-123',
      '订单不存在',
      'ORDER_NOT_FOUND',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.NOT_FOUND);
  });
});
