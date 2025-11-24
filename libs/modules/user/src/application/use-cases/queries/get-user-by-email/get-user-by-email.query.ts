import { ExecutionContext, QueryBase } from '@hl8/application-base';
import { UserDTO } from '../../../dtos/user.dto.js';

/**
 * @public
 * @description 根据邮箱查询用户查询。
 */
export class GetUserByEmailQuery extends QueryBase<UserDTO | null> {
  public constructor(
    context: ExecutionContext,
    public readonly email: string,
  ) {
    super(context);
  }

  /**
   * @description 返回审计所需的查询参数。
   */
  public auditPayload(): Record<string, unknown> {
    return {
      email: this.email,
    };
  }
}
