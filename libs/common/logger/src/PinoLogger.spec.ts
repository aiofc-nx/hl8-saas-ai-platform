import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type pino from 'pino';
import { PinoLogger, __resetOutOfContextForTests } from './PinoLogger.js';
import { Store, storage } from './storage.js';

describe('PinoLogger', () => {
  let mockPinoLogger: jest.Mocked<pino.Logger>;
  let pinoLogger: PinoLogger;
  const defaultParams = { renameContext: undefined, pinoHttp: {} };

  beforeEach(() => {
    // 重置 outOfContext，确保测试使用我们设置的 mock
    __resetOutOfContextForTests();

    // 创建 mock Pino logger
    mockPinoLogger = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<pino.Logger>;
  });

  afterEach(() => {
    // 清理 storage
    __resetOutOfContextForTests();
  });

  describe('构造函数', () => {
    it('应使用默认上下文字段名称', () => {
      pinoLogger = new PinoLogger(defaultParams);
      expect(pinoLogger).toBeDefined();
    });

    it('应使用自定义上下文字段名称', () => {
      const customParams = { renameContext: 'module', pinoHttp: {} };
      pinoLogger = new PinoLogger(customParams);
      expect(pinoLogger).toBeDefined();
    });

    it('应使用自定义错误键名', () => {
      const customParams = {
        pinoHttp: {
          customAttributeKeys: {
            err: 'error',
          },
        },
      };
      pinoLogger = new PinoLogger(customParams);
      expect(pinoLogger).toBeDefined();
    });
  });

  describe('setContext', () => {
    beforeEach(() => {
      // 使用 storage.run 来确保在正确的上下文中
      storage.run(new Store(mockPinoLogger), () => {
        pinoLogger = new PinoLogger(defaultParams);
      });
    });

    it('应设置日志上下文', () => {
      storage.run(new Store(mockPinoLogger), () => {
        pinoLogger.setContext('UserService');
        pinoLogger.info('测试日志');

        expect(mockPinoLogger.info).toHaveBeenCalledWith(
          { context: 'UserService' },
          '测试日志',
        );
      });
    });

    it('应支持多次设置上下文', () => {
      storage.run(new Store(mockPinoLogger), () => {
        pinoLogger.setContext('UserService');
        pinoLogger.info('日志1');

        pinoLogger.setContext('AuthService');
        pinoLogger.info('日志2');

        expect(mockPinoLogger.info).toHaveBeenNthCalledWith(
          1,
          { context: 'UserService' },
          '日志1',
        );
        expect(mockPinoLogger.info).toHaveBeenNthCalledWith(
          2,
          { context: 'AuthService' },
          '日志2',
        );
      });
    });
  });

  describe('日志方法', () => {
    beforeEach(() => {
      // 使用 storage.run 来确保在正确的上下文中
      storage.run(new Store(mockPinoLogger), () => {
        pinoLogger = new PinoLogger(defaultParams);
        pinoLogger.setContext('TestService');
      });
    });

    describe('trace', () => {
      it('应记录字符串消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          pinoLogger.trace('跟踪日志');

          expect(mockPinoLogger.trace).toHaveBeenCalledWith(
            { context: 'TestService' },
            '跟踪日志',
          );
        });
      });

      it('应记录对象消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const message = { userId: 123, action: 'trace' };
          pinoLogger.trace(message);

          expect(mockPinoLogger.trace).toHaveBeenCalledWith({
            ...message,
            context: 'TestService',
          });
        });
      });

      it('应处理 Error 对象', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const error = new Error('跟踪错误');
          pinoLogger.trace(error);

          expect(mockPinoLogger.trace).toHaveBeenCalledWith({
            err: error,
            context: 'TestService',
          });
        });
      });
    });

    describe('debug', () => {
      it('应记录字符串消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          pinoLogger.debug('调试日志');

          expect(mockPinoLogger.debug).toHaveBeenCalledWith(
            { context: 'TestService' },
            '调试日志',
          );
        });
      });

      it('应记录对象消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const message = { requestId: 'req-123' };
          pinoLogger.debug(message);

          expect(mockPinoLogger.debug).toHaveBeenCalledWith({
            ...message,
            context: 'TestService',
          });
        });
      });
    });

    describe('info', () => {
      it('应记录字符串消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          pinoLogger.info('信息日志');

          expect(mockPinoLogger.info).toHaveBeenCalledWith(
            { context: 'TestService' },
            '信息日志',
          );
        });
      });

      it('应记录对象消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const message = { userId: 123, action: 'login' };
          pinoLogger.info(message);

          expect(mockPinoLogger.info).toHaveBeenCalledWith({
            ...message,
            context: 'TestService',
          });
        });
      });
    });

    describe('warn', () => {
      it('应记录字符串消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          pinoLogger.warn('警告日志');

          expect(mockPinoLogger.warn).toHaveBeenCalledWith(
            { context: 'TestService' },
            '警告日志',
          );
        });
      });

      it('应记录对象消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const message = { responseTime: 5000 };
          pinoLogger.warn(message);

          expect(mockPinoLogger.warn).toHaveBeenCalledWith({
            ...message,
            context: 'TestService',
          });
        });
      });
    });

    describe('error', () => {
      it('应记录字符串消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          pinoLogger.error('错误日志');

          expect(mockPinoLogger.error).toHaveBeenCalledWith(
            { context: 'TestService' },
            '错误日志',
          );
        });
      });

      it('应记录对象消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const message = { error: 'Validation failed' };
          pinoLogger.error(message);

          expect(mockPinoLogger.error).toHaveBeenCalledWith({
            ...message,
            context: 'TestService',
          });
        });
      });

      it('应处理 Error 对象', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const error = new Error('数据库错误');
          pinoLogger.error(error);

          expect(mockPinoLogger.error).toHaveBeenCalledWith({
            err: error,
            context: 'TestService',
          });
        });
      });
    });

    describe('fatal', () => {
      it('应记录字符串消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          pinoLogger.fatal('致命错误日志');

          expect(mockPinoLogger.fatal).toHaveBeenCalledWith(
            { context: 'TestService' },
            '致命错误日志',
          );
        });
      });

      it('应记录对象消息', () => {
        storage.run(new Store(mockPinoLogger), () => {
          const message = { error: '应用启动失败' };
          pinoLogger.fatal(message);

          expect(mockPinoLogger.fatal).toHaveBeenCalledWith({
            ...message,
            context: 'TestService',
          });
        });
      });
    });
  });

  describe('assign', () => {
    beforeEach(() => {
      storage.run(new Store(mockPinoLogger), () => {
        pinoLogger = new PinoLogger(defaultParams);
      });
    });

    it('应在请求作用域内绑定字段', () => {
      storage.run(new Store(mockPinoLogger), () => {
        const fields = { userId: 123, requestId: 'req-456' };
        pinoLogger.assign(fields);

        expect(mockPinoLogger.child).toHaveBeenCalledWith(fields);
      });
    });

    it('在请求作用域外应抛出错误', () => {
      // 临时 mock storage.getStore 返回 undefined，模拟不在请求作用域内
      const originalGetStore = storage.getStore.bind(storage);
      jest.spyOn(storage, 'getStore').mockReturnValue(undefined);

      try {
        expect(() => {
          pinoLogger.assign({ userId: 123 });
        }).toThrow('unable to assign extra fields out of request scope');
      } finally {
        // 恢复原始的 getStore
        jest.restoreAllMocks();
      }
    });
  });

  describe('无上下文日志', () => {
    it('应支持不设置上下文的日志记录', () => {
      pinoLogger = new PinoLogger(defaultParams);
      // 不调用 setContext
      // 重置 mock
      jest.clearAllMocks();

      // 进入 storage 作用域
      storage.enterWith({ logger: mockPinoLogger, responseLogger: undefined });

      pinoLogger.info('无上下文日志');

      // 由于没有设置上下文，应该只包含空上下文或默认上下文
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });
  });
});
