import { describe, expect, it, jest } from '@jest/globals';
import type { Logger } from 'pino';
import { isPassedLogger, PARAMS_PROVIDER_TOKEN } from './params.js';

describe('params', () => {
  describe('isPassedLogger', () => {
    it('应识别 PassedLogger 类型的对象', () => {
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as Logger;

      const passedLogger = { logger };

      expect(isPassedLogger(passedLogger)).toBe(true);
    });

    it('应拒绝非 PassedLogger 类型的对象', () => {
      expect(isPassedLogger({})).toBe(false);
      expect(isPassedLogger(null)).toBe(false);
      expect(isPassedLogger(undefined)).toBe(false);
      expect(isPassedLogger({ log: jest.fn() })).toBe(false);
      expect(isPassedLogger('string')).toBe(false);
      expect(isPassedLogger(123)).toBe(false);
    });

    it('应拒绝缺少 logger 属性的对象', () => {
      expect(isPassedLogger({ otherProperty: 'value' })).toBe(false);
    });
  });

  describe('PARAMS_PROVIDER_TOKEN', () => {
    it('应导出配置参数提供者令牌', () => {
      expect(PARAMS_PROVIDER_TOKEN).toBe('pino-params');
    });
  });
});
