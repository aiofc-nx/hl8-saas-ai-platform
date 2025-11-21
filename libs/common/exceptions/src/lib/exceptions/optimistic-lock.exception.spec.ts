import { HttpStatus } from '@nestjs/common';
import { OptimisticLockException } from './optimistic-lock.exception.js';

describe('OptimisticLockException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new OptimisticLockException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '数据版本冲突',
      detail: '数据已被其他操作更新，请刷新后重试',
      status: HttpStatus.CONFLICT,
      instance: 'req-1',
    });
    expect(response.data).toEqual({
      currentVersion: undefined,
      expectedVersion: undefined,
    });
  });

  it('应支持 currentVersion 和 expectedVersion', () => {
    const exception = new OptimisticLockException(5, 4);
    const response = exception.toErrorResponse('req-2');

    expect(response.data).toEqual({
      currentVersion: 5,
      expectedVersion: 4,
    });
    expect(response.status).toBe(HttpStatus.CONFLICT);
  });

  it('应支持仅设置 currentVersion', () => {
    const exception = new OptimisticLockException(10);
    const response = exception.toErrorResponse('req-3');

    expect(response.data).toEqual({
      currentVersion: 10,
      expectedVersion: undefined,
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new OptimisticLockException(
      3,
      2,
      '数据已被其他用户修改，请刷新后重试',
    );
    const response = exception.toErrorResponse('req-4');

    expect(response.detail).toBe('数据已被其他用户修改，请刷新后重试');
  });

  it('应支持自定义 errorCode', () => {
    const exception = new OptimisticLockException(
      5,
      4,
      '版本冲突',
      'VERSION_CONFLICT',
    );
    const response = exception.toErrorResponse('req-5');

    expect(response.errorCode).toBe('VERSION_CONFLICT');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('数据库版本检查失败');
    const exception = new OptimisticLockException(
      5,
      4,
      '版本冲突',
      'VERSION_CONFLICT',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.CONFLICT);
  });
});
