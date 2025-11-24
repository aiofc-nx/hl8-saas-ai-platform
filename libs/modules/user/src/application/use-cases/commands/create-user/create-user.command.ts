import {
  AbilityDescriptor,
  CaslCommandBase,
  SecurityContext,
} from '@hl8/application-base';
import { UserDTO } from '../../../dtos/user.dto.js';

/**
 * @public
 * @description 创建用户命令结果。
 */
export interface CreateUserResult {
  /**
   * @description 创建的用户信息。
   */
  readonly user: UserDTO;
}

/**
 * @public
 * @description 创建用户命令。
 */
export class CreateUserCommand extends CaslCommandBase<CreateUserResult> {
  public constructor(
    context: SecurityContext,
    public readonly email: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly profile: {
      readonly name: string;
      readonly gender: string;
      readonly phoneNumber?: string | null;
      readonly profilePicture?: string | null;
      readonly dateOfBirth?: string | null;
      readonly address?: string | null;
    },
  ) {
    super(context);
  }

  /**
   * @description 返回执行当前命令所需的权限描述。
   */
  public abilityDescriptor(): AbilityDescriptor {
    return {
      action: 'create',
      subject: 'User',
      conditions: {
        tenantId: this.context.tenantId,
      },
    };
  }

  /**
   * @description 返回审计所需的载荷。
   */
  public auditPayload(): Record<string, unknown> {
    return {
      email: this.email,
      username: this.username,
      profile: this.profile,
    };
  }
}
