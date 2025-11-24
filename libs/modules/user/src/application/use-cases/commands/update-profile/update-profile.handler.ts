import { CaslCommandHandler } from '@hl8/application-base';
import { AggregateId, DateTimeValueObject, TenantId } from '@hl8/domain-base';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { User } from '../../../../domain/aggregates/user.aggregate.js';
import { UserNotFoundException } from '../../../../domain/exceptions/user-domain.exception.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { UserDTO } from '../../../dtos/user.dto.js';
import {
  UpdateProfileCommand,
  UpdateProfileResult,
} from './update-profile.command.js';

/**
 * @public
 * @description 更新用户资料命令处理器。
 */
@Injectable()
export class UpdateProfileHandler extends CaslCommandHandler<
  UpdateProfileCommand,
  UpdateProfileResult
> {
  public constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly abilityCoordinator: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly auditCoordinator: any,
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {
    super(abilityCoordinator, auditCoordinator);
  }

  /**
   * @description 处理更新用户资料命令。
   * @param command - 更新用户资料命令。
   * @returns 更新用户资料结果。
   * @throws {UserNotFoundException} 当用户不存在时抛出。
   */
  protected async handle(
    command: UpdateProfileCommand,
  ): Promise<UpdateProfileResult> {
    const userId = AggregateId.fromString(command.userId);
    const tenantId = TenantId.create(command.context.tenantId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(`用户 ${command.userId} 不存在`);
    }

    // 校验租户范围
    this.assertTenantScope(command, user.tenantId.toString());

    // 准备更新数据
    const updates: {
      name?: string;
      gender?: string;
      phoneNumber?: string | null;
      profilePicture?: string | null;
      dateOfBirth?: Date | DateTimeValueObject | null;
      address?: string | null;
    } = {};

    if (command.profileUpdates.name !== undefined) {
      updates.name = command.profileUpdates.name;
    }
    if (command.profileUpdates.gender !== undefined) {
      updates.gender = command.profileUpdates.gender;
    }
    if (command.profileUpdates.phoneNumber !== undefined) {
      updates.phoneNumber = command.profileUpdates.phoneNumber;
    }
    if (command.profileUpdates.profilePicture !== undefined) {
      updates.profilePicture = command.profileUpdates.profilePicture;
    }
    if (command.profileUpdates.dateOfBirth !== undefined) {
      updates.dateOfBirth = command.profileUpdates.dateOfBirth
        ? DateTimeValueObject.fromISOString(command.profileUpdates.dateOfBirth)
        : null;
    }
    if (command.profileUpdates.address !== undefined) {
      updates.address = command.profileUpdates.address;
    }

    // 更新用户资料
    user.updateProfile(updates, command.context.userId);

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
