import { User } from '@/features/users/entities/user.entity';
import { GeneralNotFoundException } from '@hl8/exceptions';
import { InjectRepository } from '@hl8/mikro-orm-nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

/**
 * 用户服务，用于管理用户数据。
 *
 * @description 提供用户数据的查询和管理功能，包括获取所有用户和根据标识符查找用户。
 */
@Injectable()
export class UsersService {
  /**
   * 创建 UsersService 实例。
   *
   * @param {EntityRepository<User>} userRepository - 用户实体的仓库。
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  /**
   * 检索所有用户及其个人资料。
   *
   * @description 从数据库获取所有用户记录，包括关联的个人资料信息。
   *
   * @returns {Promise<User[]>} 解析为用户数组（包含个人资料）的 Promise。
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll({
      populate: ['profile'],
    });
  }

  /**
   * 根据用户名获取用户。
   *
   * @description 根据用户名查找用户，包括关联的个人资料信息。
   *
   * @param {string} identifier - 要查找的用户名。
   * @returns {Promise<User>} 解析为用户实体（包含个人资料）的 Promise。
   * @throws {NotFoundException} 如果用户不存在。
   */
  async findOne(identifier: string): Promise<User> {
    const user = await this.userRepository.findOne(
      { username: identifier },
      { populate: ['profile'] },
    );
    if (!user) {
      throw new GeneralNotFoundException('用户不存在', 'USER_NOT_FOUND');
    }
    return user;
  }
}
