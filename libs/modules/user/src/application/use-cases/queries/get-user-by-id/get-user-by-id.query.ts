import { ExecutionContext, QueryBase } from '@hl8/application-base';
import { UserDTO } from '../../../dtos/user.dto.js';

/**
 * @public
 * @description 根据ID查询用户查询。
 */
export class GetUserByIdQuery extends QueryBase<UserDTO | null> {
  public constructor(
    context: ExecutionContext,
    public readonly userId: string,
  ) {
    super(context);
  }

  /**
   * @description 返回审计所需的查询参数。
   */
  public auditPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
    };
  }
}
