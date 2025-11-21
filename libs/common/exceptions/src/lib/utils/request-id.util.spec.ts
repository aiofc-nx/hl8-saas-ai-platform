import type { ArgumentsHost } from '@nestjs/common';
import { resolveRequestId } from './request-id.util.js';

const createHttpContext = (
  request: Record<string, unknown>,
): ReturnType<ArgumentsHost['switchToHttp']> =>
  ({
    getRequest: () => request,
    getResponse: () => ({}),
    getNext: () => undefined,
  }) as unknown as ReturnType<ArgumentsHost['switchToHttp']>;

describe('resolveRequestId', () => {
  it('优先读取 requestId 字段', () => {
    const context = createHttpContext({ requestId: 'req-1' });
    expect(resolveRequestId(context)).toBe('req-1');
  });

  it('退化到 id 字段', () => {
    const context = createHttpContext({ id: 123 });
    expect(resolveRequestId(context)).toBe('123');
  });

  it('继续尝试读取请求头', () => {
    const context = createHttpContext({
      headers: { 'x-request-id': 'header-id' },
    });
    expect(resolveRequestId(context)).toBe('header-id');
  });

  it('最终回退到随机 UUID', () => {
    const context = createHttpContext({});
    const resolved = resolveRequestId(context);

    expect(typeof resolved).toBe('string');
    expect(resolved).toHaveLength(36);
    expect(resolved).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('应处理数字类型的 id', () => {
    const context = createHttpContext({ id: 12345 });
    expect(resolveRequestId(context)).toBe('12345');
  });

  it('应处理对象类型的 id（有 toString 方法）', () => {
    const context = createHttpContext({
      id: {
        toString: () => 'obj-id-123',
      },
    });
    expect(resolveRequestId(context)).toBe('obj-id-123');
  });

  it('应忽略空的 toString 结果', () => {
    const context = createHttpContext({
      id: {
        toString: () => '',
      },
    });
    const resolved = resolveRequestId(context);

    // 应该回退到 UUID
    expect(resolved).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('应处理 null 和 undefined 值', () => {
    const context1 = createHttpContext({ requestId: null });
    const context2 = createHttpContext({ requestId: undefined });

    const resolved1 = resolveRequestId(context1);
    const resolved2 = resolveRequestId(context2);

    expect(resolved1).toMatch(/^[0-9a-f-]{36}$/i);
    expect(resolved2).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('应处理空字符串', () => {
    const context = createHttpContext({ requestId: '' });
    const resolved = resolveRequestId(context);

    expect(resolved).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('应处理空白字符串', () => {
    const context = createHttpContext({ requestId: '   ' });
    const resolved = resolveRequestId(context);

    expect(resolved).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('应去除字符串两端的空白', () => {
    const context = createHttpContext({ requestId: '  req-123  ' });
    expect(resolveRequestId(context)).toBe('req-123');
  });

  it('应处理 NaN 数字', () => {
    const context = createHttpContext({ id: Number.NaN });
    const resolved = resolveRequestId(context);

    expect(resolved).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('应处理无 request 对象的情况', () => {
    const context = {
      getRequest: () => null,
      getResponse: () => ({}),
      getNext: () => undefined,
    } as unknown as ReturnType<ArgumentsHost['switchToHttp']>;

    const resolved = resolveRequestId(context);
    expect(resolved).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('应处理 toString 抛出异常的情况', () => {
    const context = createHttpContext({
      id: {
        toString: () => {
          throw new Error('toString failed');
        },
      },
    });

    const resolved = resolveRequestId(context);
    expect(resolved).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
