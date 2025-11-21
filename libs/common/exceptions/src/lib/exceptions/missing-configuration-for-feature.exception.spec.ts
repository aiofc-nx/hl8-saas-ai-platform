import { HttpStatus } from '@nestjs/common';
import { MissingConfigurationForFeatureException } from './missing-configuration-for-feature.exception.js';

describe('MissingConfigurationForFeatureException', () => {
  it('应使用默认消息创建异常', () => {
    const exception = new MissingConfigurationForFeatureException();
    const response = exception.toErrorResponse('req-1');

    expect(response).toMatchObject({
      title: '配置缺失',
      detail: '功能配置缺失，请联系运维人员补充配置',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      instance: 'req-1',
    });
    expect(response.data).toEqual({
      feature: undefined,
      configKey: undefined,
    });
  });

  it('应支持 feature 和 configKey', () => {
    const exception = new MissingConfigurationForFeatureException(
      'sms',
      'sms.apiKey',
    );
    const response = exception.toErrorResponse('req-2');

    expect(response.data).toEqual({
      feature: 'sms',
      configKey: 'sms.apiKey',
    });
    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('应支持仅设置 feature', () => {
    const exception = new MissingConfigurationForFeatureException('payment');
    const response = exception.toErrorResponse('req-3');

    expect(response.data).toEqual({
      feature: 'payment',
      configKey: undefined,
    });
  });

  it('应支持自定义 detail', () => {
    const exception = new MissingConfigurationForFeatureException(
      'email',
      'email.smtp.host',
      '邮件服务配置缺失',
    );
    const response = exception.toErrorResponse('req-4');

    expect(response.detail).toBe('邮件服务配置缺失');
  });

  it('应支持自定义 errorCode', () => {
    const exception = new MissingConfigurationForFeatureException(
      'sms',
      'sms.apiKey',
      '配置缺失',
      'MISSING_CONFIG',
    );
    const response = exception.toErrorResponse('req-5');

    expect(response.errorCode).toBe('MISSING_CONFIG');
  });

  it('应支持 rootCause', () => {
    const rootError = new Error('配置读取失败');
    const exception = new MissingConfigurationForFeatureException(
      'storage',
      'storage.bucket',
      '存储配置缺失',
      'STORAGE_CONFIG_MISSING',
      rootError,
    );

    expect(exception.rootCause).toBe(rootError);
    expect(exception.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
