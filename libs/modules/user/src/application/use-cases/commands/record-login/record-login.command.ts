import { CommandBase, ExecutionContext } from '@hl8/application-base';

/**
 * @public
 * @description 记录登录命令。
 */
export class RecordLoginCommand extends CommandBase<void> {
  public constructor(
    context: ExecutionContext,
    public readonly userId: string,
  ) {
    super(context);
  }

  /**
   * @description 返回审计所需的载荷。
   */
  public auditPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
    };
  }
}
