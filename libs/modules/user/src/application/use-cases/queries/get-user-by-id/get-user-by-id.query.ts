import {
  AbilityDescriptor,
  CaslQueryBase,
  SecurityContext,
} from '@hl8/application-base';
import { UserDTO } from '../../../dtos/user.dto.js';

/**
 * @public
 * @description 根据ID查询用户查询。
 */
export class GetUserByIdQuery extends CaslQueryBase<UserDTO | null> {
  public constructor(
    context: SecurityContext,
    public readonly userId: string,
  ) {
    super(context);
  }

  /**
   * @description 返回执行当前查询所需的权限描述。
   */
  public abilityDescriptor(): AbilityDescriptor {
    return {
      action: 'read',
      subject: 'User',
      conditions: {
        tenantId: this.context.tenantId,
        userId: this.userId,
      },
    };
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
