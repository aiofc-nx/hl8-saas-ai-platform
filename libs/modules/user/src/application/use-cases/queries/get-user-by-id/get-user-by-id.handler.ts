import { CaslQueryHandler } from '@hl8/application-base';
import { AggregateId, TenantId } from '@hl8/domain-base';
import { Injectable } from '@nestjs/common';
import { User } from '../../../../domain/aggregates/user.aggregate.js';
import type { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { UserDTO } from '../../../dtos/user.dto.js';
import { GetUserByIdQuery } from './get-user-by-id.query.js';

/**
 * @public
 * @description 根据ID查询用户查询处理器。
 */
@Injectable()
export class GetUserByIdHandler extends CaslQueryHandler<
  GetUserByIdQuery,
  UserDTO | null
> {
  public constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly abilityCoordinator: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly auditCoordinator: any,
    private readonly userRepository: UserRepository,
  ) {
    super(abilityCoordinator, auditCoordinator);
  }

  /**
   * @description 处理根据ID查询用户查询。
   * @param query - 根据ID查询用户查询。
   * @returns 用户DTO或null。
   */
  protected async handle(query: GetUserByIdQuery): Promise<UserDTO | null> {
    const userId = AggregateId.fromString(query.userId);
    const tenantId = TenantId.create(query.context.tenantId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    // 校验租户范围
    this.assertTenantScope(query, user.tenantId.toString());

    // 转换为 DTO
    return this.toDTO(user);
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
