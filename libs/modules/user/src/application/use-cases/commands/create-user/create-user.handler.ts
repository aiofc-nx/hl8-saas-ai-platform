import { CaslCommandHandler } from '@hl8/application-base';
import { TenantId } from '@hl8/domain-base';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { User } from '../../../../domain/aggregates/user.aggregate.js';
import { UserAlreadyExistsException } from '../../../../domain/exceptions/user-domain.exception.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import {
  Email,
  PasswordHash,
  UserProfile,
  Username,
} from '../../../../domain/value-objects/index.js';
import { UserDTO } from '../../../dtos/user.dto.js';
import { CreateUserCommand, CreateUserResult } from './create-user.command.js';

/**
 * @public
 * @description 创建用户命令处理器。
 */
@Injectable()
export class CreateUserHandler extends CaslCommandHandler<
  CreateUserCommand,
  CreateUserResult
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
   * @description 处理创建用户命令。
   * @param command - 创建用户命令。
   * @returns 创建用户结果。
   * @throws {UserAlreadyExistsException} 当邮箱或用户名已存在时抛出。
   */
  protected async handle(
    command: CreateUserCommand,
  ): Promise<CreateUserResult> {
    const tenantId = TenantId.create(command.context.tenantId);
    const email = Email.create(command.email);
    const username = Username.create(command.username);

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.userRepository.findByEmail(
      email,
      tenantId,
    );
    if (existingUserByEmail) {
      throw new UserAlreadyExistsException(`邮箱 ${command.email} 已被使用`);
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findByUsername(
      username,
      tenantId,
    );
    if (existingUserByUsername) {
      throw new UserAlreadyExistsException(
        `用户名 ${command.username} 已被使用`,
      );
    }

    // 创建用户聚合根
    const user = User.create({
      tenantId,
      email,
      username,
      passwordHash: PasswordHash.create(command.passwordHash),
      profile: UserProfile.create({
        ...command.profile,
        dateOfBirth: command.profile.dateOfBirth
          ? new Date(command.profile.dateOfBirth)
          : null,
      }),
      createdBy: command.context.userId,
    });

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
