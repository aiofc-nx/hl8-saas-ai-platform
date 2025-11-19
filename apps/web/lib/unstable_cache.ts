/**
 * @description 提供去重功能的 unstable_cache 包装函数
 * @template Inputs - 输入参数数组类型
 * @template Output - 输出类型
 * @param cb - 要缓存的异步回调函数
 * @param keyParts - 缓存键的组成部分数组
 * @param options - 可选的缓存配置选项
 * @param options.revalidate - 重新验证间隔（秒），或 false 表示禁用重新验证
 * @param options.tags - 缓存标签数组，用于批量失效缓存
 * @returns 返回包装后的缓存函数
 * @remarks
 * - next_unstable_cache 不处理去重，因此我们使用 React 的 cache 包装它以提供去重功能
 * - 在同一请求中多次调用相同的缓存函数时，只会执行一次实际的计算
 * @see https://github.com/ethanniser/NextMaster/blob/main/src/lib/unstable-cache.ts
 */
export const unstable_cache = <Inputs extends unknown[], Output>(
  cb: (...args: Inputs) => Promise<Output>,
  keyParts: string[],
  options?: {
    /**
     * 重新验证间隔（秒）
     */
    revalidate?: number | false;
    tags?: string[];
  },
) => cache(next_unstable_cache(cb, keyParts, options));
