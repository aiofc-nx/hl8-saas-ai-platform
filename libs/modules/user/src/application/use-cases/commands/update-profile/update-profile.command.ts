import {
  AbilityDescriptor,
  CaslCommandBase,
  SecurityContext,
} from '@hl8/application-base';
import { UpdateProfileDTO } from '../../../dtos/update-profile.dto.js';
import { UserDTO } from '../../../dtos/user.dto.js';

/**
 * @public
 * @description 更新用户资料命令结果。
 */
export interface UpdateProfileResult {
  /**
   * @description 更新后的用户信息。
   */
  readonly user: UserDTO;
}

/**
 * @public
 * @description 更新用户资料命令。
 */
export class UpdateProfileCommand extends CaslCommandBase<UpdateProfileResult> {
  public constructor(
    context: SecurityContext,
    public readonly userId: string,
    public readonly profileUpdates: UpdateProfileDTO,
  ) {
    super(context);
  }

  /**
   * @description 返回执行当前命令所需的权限描述。
   */
  public abilityDescriptor(): AbilityDescriptor {
    return {
      action: 'update',
      subject: 'User',
      conditions: {
        tenantId: this.context.tenantId,
        userId: this.userId,
      },
    };
  }

  /**
   * @description 返回审计所需的载荷。
   */
  public auditPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      profileUpdates: this.profileUpdates,
    };
  }
}
