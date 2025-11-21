import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { Logger } from 'pino';
import { Store, storage } from './storage.js';

describe('storage', () => {
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;
  });

  afterEach(() => {
    // 清理 storage - AsyncLocalStorage 没有 exit 方法，只能通过 run 来管理作用域
    // 在测试中，每个测试都会创建新的 run 作用域，所以不需要手动清理
  });

  describe('Store', () => {
    it('应创建 Store 实例', () => {
      const store = new Store(mockLogger);

      expect(store.logger).toBe(mockLogger);
      expect(store.responseLogger).toBeUndefined();
    });

    it('应创建包含 responseLogger 的 Store 实例', () => {
      const responseLogger = { ...mockLogger };
      const store = new Store(mockLogger, responseLogger);

      expect(store.logger).toBe(mockLogger);
      expect(store.responseLogger).toBe(responseLogger);
    });
  });

  describe('storage (AsyncLocalStorage)', () => {
    it('应在存储作用域内存储和获取 Store', () => {
      const store = new Store(mockLogger);

      storage.run(store, () => {
        const retrievedStore = storage.getStore();
        expect(retrievedStore).toBe(store);
        expect(retrievedStore?.logger).toBe(mockLogger);
      });
    });

    it('在存储作用域外应返回 undefined', () => {
      const store = storage.getStore();
      expect(store).toBeUndefined();
    });

    it('应支持嵌套的存储作用域', () => {
      const store1 = new Store(mockLogger);
      const mockLogger2 = { ...mockLogger };
      const store2 = new Store(mockLogger2);

      storage.run(store1, () => {
        expect(storage.getStore()?.logger).toBe(mockLogger);

        storage.run(store2, () => {
          expect(storage.getStore()?.logger).toBe(mockLogger2);
        });

        // 外层作用域应该保持不变
        expect(storage.getStore()?.logger).toBe(mockLogger);
      });
    });

    it('应支持退出存储作用域', () => {
      const store = new Store(mockLogger);

      storage.run(store, () => {
        expect(storage.getStore()).toBe(store);
      });

      // 退出后应返回 undefined
      expect(storage.getStore()).toBeUndefined();
    });

    it('应支持 enterWith 方法', () => {
      const store = new Store(mockLogger);

      // AsyncLocalStorage 的 enterWith 方法用于设置当前执行上下文
      // 注意：这个方法会改变当前执行上下文，测试后需要清理
      storage.enterWith(store);

      expect(storage.getStore()).toBe(store);

      // 清理：通过 run 一个新的空作用域来重置
      storage.run(new Store(mockLogger), () => {
        // 空作用域，用于清理
      });
      // 注意：enterWith 会持续影响后续测试，所以这里我们通过 run 来重置
    });
  });
});
