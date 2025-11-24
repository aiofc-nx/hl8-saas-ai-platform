import {
  AbilityDescriptor,
  CaslCommandBase,
  SecurityContext,
} from '@hl8/application-base';

/**
 * @public
 * @description 修改密码命令。
 */
export class ChangePasswordCommand extends CaslCommandBase<void> {
  public constructor(
    context: SecurityContext,
    public readonly userId: string,
    public readonly newPasswordHash: string,
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
    };
  }
}
