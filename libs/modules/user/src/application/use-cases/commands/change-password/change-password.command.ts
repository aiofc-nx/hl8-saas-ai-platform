import { CommandBase, ExecutionContext } from '@hl8/application-base';

/**
 * @public
 * @description 修改密码命令。
 */
export class ChangePasswordCommand extends CommandBase<void> {
  public constructor(
    context: ExecutionContext,
    public readonly userId: string,
    public readonly newPasswordHash: string,
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
