import type { ExecutionContext } from '@hl8/common';

/**
 * @public
 * @description 命令基类，封装执行上下文。
 */
export abstract class CommandBase<_TResponse = void> {
  protected constructor(public readonly context: ExecutionContext) {}

  /**
   * @description 返回审计所需的载荷，默认返回 undefined。
   */
  public auditPayload(): Record<string, unknown> | undefined {
    return undefined;
  }
}
