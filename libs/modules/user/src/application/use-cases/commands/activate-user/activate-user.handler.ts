import { CommandHandler } from '@hl8/application-base';
import { AggregateId, TenantId } from '@hl8/domain-base';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { User } from '../../../../domain/aggregates/user.aggregate.js';
import { UserNotFoundException } from '../../../../domain/exceptions/user-domain.exception.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { UserDTO } from '../../../dtos/user.dto.js';
import {
  ActivateUserCommand,
  ActivateUserResult,
} from './activate-user.command.js';

/**
 * @public
 * @description 激活用户命令处理器。
 */
@Injectable()
export class ActivateUserHandler extends CommandHandler<
  ActivateUserCommand,
  ActivateUserResult
> {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {
    super();
  }

  /**
   * @description 处理激活用户命令。
   * @param command - 激活用户命令。
   * @returns 激活用户结果。
   * @throws {UserNotFoundException} 当用户不存在时抛出。
   */
  protected async handle(
    command: ActivateUserCommand,
  ): Promise<ActivateUserResult> {
    const userId = AggregateId.fromString(command.userId);
    const tenantId = TenantId.create(command.context.tenantId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(`用户 ${command.userId} 不存在`);
    }

    // 校验租户范围
    this.assertTenantScope(command.context, user.tenantId.toString());

    // 激活用户
    user.activate(command.context.userId);

    // 持久化用户
    await this.userRepository.save(user);

    // 发布领域事件
    const domainEvents = user.pullDomainEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
    }

    // 转换为 DTO
    const userDTO = this.toDTO(user);

    return {
      user: userDTO,
    };
  }

  /**
   * @description 将用户聚合根转换为 DTO。
   */
  private toDTO(user: User): UserDTO {
    return {
      id: user.id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email.value,
      username: user.username.value,
      status: user.status.value,
      profile: {
        name: user.profile.name,
        gender: user.profile.gender,
        phoneNumber: user.profile.phoneNumber,
        profilePicture: user.profile.profilePicture,
        dateOfBirth: user.profile.dateOfBirth?.toISOString() ?? null,
        address: user.profile.address,
      },
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.auditTrail.createdAt.toISOString(),
      updatedAt: user.auditTrail.updatedAt.toISOString(),
    };
  }
}
