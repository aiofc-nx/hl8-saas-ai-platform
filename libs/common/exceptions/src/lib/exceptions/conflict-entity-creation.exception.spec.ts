import { HttpStatus } from '@nestjs/common';
import { ConflictEntityCreationException } from './conflict-entity-creation.exception.js';

describe('ConflictEntityCreationException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new ConflictEntityCreationException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '数据冲突',
      detail: '目标资源已存在，无法重复创建',
      status: HttpStatus.CONFLICT,
      instance: 'req-1',
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new ConflictEntityCreationException('用户邮箱已存在');
    const response = exception.toErrorResponse('req-2');

    expect(response.detail).toBe('用户邮箱已存在');
    expect(response.status).toBe(HttpStatus.CONFLICT);
  });

  it('应支持自定义 errorCode', () => {
    const exception = new ConflictEntityCreationException(
      '资源冲突',
      'RESOURCE_CONFLICT',
    );
    const response = exception.toErrorResponse('req-3');

    expect(response.errorCode).toBe('RESOURCE_CONFLICT');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('唯一约束冲突');
    const exception = new ConflictEntityCreationException(
      '数据已存在',
      'DUPLICATE_ENTRY',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.CONFLICT);
  });
});
