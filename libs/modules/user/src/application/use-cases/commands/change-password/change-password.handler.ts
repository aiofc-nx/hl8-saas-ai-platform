import { CommandHandler } from '@hl8/application-base';
import { AggregateId, TenantId } from '@hl8/domain-base';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserNotFoundException } from '../../../../domain/exceptions/user-domain.exception.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { PasswordHash } from '../../../../domain/value-objects/password-hash.vo.js';
import { ChangePasswordCommand } from './change-password.command.js';

/**
 * @public
 * @description 修改密码命令处理器。
 */
@Injectable()
export class ChangePasswordHandler extends CommandHandler<
  ChangePasswordCommand,
  void
> {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {
    super();
  }

  /**
   * @description 处理修改密码命令。
   * @param command - 修改密码命令。
   * @throws {UserNotFoundException} 当用户不存在时抛出。
   */
  protected async handle(command: ChangePasswordCommand): Promise<void> {
    const userId = AggregateId.fromString(command.userId);
    const tenantId = TenantId.create(command.context.tenantId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(`用户 ${command.userId} 不存在`);
    }

    // 校验租户范围
    this.assertTenantScope(command.context, user.tenantId.toString());

    // 修改密码
    user.changePassword(
      PasswordHash.create(command.newPasswordHash),
      command.context.userId,
    );

    // 持久化用户
    await this.userRepository.save(user);

    // 发布领域事件
    const domainEvents = user.pullDomainEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
    }
  }
}
