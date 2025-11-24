import { CommandBase, ExecutionContext } from '@hl8/application-base';
import { UserDTO } from '../../../dtos/user.dto.js';

/**
 * @public
 * @description 激活用户命令结果。
 */
export interface ActivateUserResult {
  /**
   * @description 激活后的用户信息。
   */
  readonly user: UserDTO;
}

/**
 * @public
 * @description 激活用户命令。
 */
export class ActivateUserCommand extends CommandBase<ActivateUserResult> {
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
