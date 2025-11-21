/**
 * Jest 单元测试设置文件。
 *
 * @description 在运行单元测试之前执行的设置代码。
 * 导入 reflect-metadata 以支持装饰器元数据。
 */

import 'reflect-metadata';

// Mock @hl8/logger 模块（ES 模块兼容性）
jest.mock('@hl8/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
  })),
  LoggerModule: {
    forRoot: jest.fn(),
    forRootAsync: jest.fn(),
  },
  LoggerErrorInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn(),
  })),
  PinoLogger: jest.fn(),
  InjectPinoLogger: jest.fn(),
  getLoggerToken: jest.fn(),
}));
