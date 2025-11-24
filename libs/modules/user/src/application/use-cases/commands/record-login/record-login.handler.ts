import { CommandHandler } from '@hl8/application-base';
import { AggregateId, TenantId } from '@hl8/domain-base';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserNotFoundException } from '../../../../domain/exceptions/user-domain.exception.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { RecordLoginCommand } from './record-login.command.js';

/**
 * @public
 * @description 记录登录命令处理器。
 */
@Injectable()
export class RecordLoginHandler extends CommandHandler<
  RecordLoginCommand,
  void
> {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {
    super();
  }

  /**
   * @description 处理记录登录命令。
   * @param command - 记录登录命令。
   * @throws {UserNotFoundException} 当用户不存在时抛出。
   */
  protected async handle(command: RecordLoginCommand): Promise<void> {
    const userId = AggregateId.fromString(command.userId);
    const tenantId = TenantId.create(command.context.tenantId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(`用户 ${command.userId} 不存在`);
    }

    // 校验租户范围
    this.assertTenantScope(command.context, user.tenantId.toString());

    // 记录登录
    user.recordLogin();

    // 持久化用户
    await this.userRepository.save(user);

    // 发布领域事件
    const domainEvents = user.pullDomainEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
    }
  }
}
