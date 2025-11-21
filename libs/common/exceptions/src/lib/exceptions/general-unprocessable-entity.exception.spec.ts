import { HttpStatus } from '@nestjs/common';
import { GeneralUnprocessableEntityException } from './general-unprocessable-entity.exception.js';

describe('GeneralUnprocessableEntityException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new GeneralUnprocessableEntityException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '无法处理的实体',
      detail: '请求已接收，但当前状态无法完成处理',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      instance: 'req-1',
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new GeneralUnprocessableEntityException(
      '订单状态不允许此操作',
    );
    const response = exception.toErrorResponse('req-2');

    expect(response.detail).toBe('订单状态不允许此操作');
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('应支持自定义 errorCode', () => {
    const exception = new GeneralUnprocessableEntityException(
      '业务规则校验失败',
      'BUSINESS_RULE_VIOLATION',
    );
    const response = exception.toErrorResponse('req-3');

    expect(response.errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('状态机转换失败');
    const exception = new GeneralUnprocessableEntityException(
      '状态不允许转换',
      'STATE_TRANSITION_FAILED',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
