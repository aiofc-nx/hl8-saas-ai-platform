import type { ExecutionContext } from '@hl8/common';

/**
 * @public
 * @description 查询基类，封装执行上下文。
 */
export abstract class QueryBase<_TResult = unknown> {
  protected constructor(public readonly context: ExecutionContext) {}

  /**
   * @description 返回审计所需的查询参数。
   */
  public auditPayload(): Record<string, unknown> | undefined {
    return undefined;
  }
}
