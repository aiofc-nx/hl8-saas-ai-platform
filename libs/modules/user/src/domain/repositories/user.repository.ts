import { AggregateId, Repository, TenantId } from '@hl8/domain-base';
import { User } from '../aggregates/user.aggregate.js';
import { Email } from '../value-objects/email.vo.js';
import { Username } from '../value-objects/username.vo.js';

/**
 * @public
 * @description 用户仓储接口，定义用户聚合的持久化契约。
 * @example
 * ```ts
 * class UserRepositoryImpl implements UserRepository {
 *   async findById(id: AggregateId): Promise<User | null> {
 *     // 实现查找逻辑
 *   }
 * }
 * ```
 */
export interface UserRepository extends Repository<User, AggregateId> {
  /**
   * @description 根据邮箱查找用户。
   * @param email - 邮箱值对象。
   * @param tenantId - 租户标识。
   * @returns 用户聚合根或 `null`。
   */
  findByEmail(email: Email, tenantId: TenantId): Promise<User | null>;

  /**
   * @description 根据用户名查找用户。
   * @param username - 用户名值对象。
   * @param tenantId - 租户标识。
   * @returns 用户聚合根或 `null`。
   */
  findByUsername(username: Username, tenantId: TenantId): Promise<User | null>;

  /**
   * @description 检查邮箱是否存在。
   * @param email - 邮箱值对象。
   * @param tenantId - 租户标识。
   * @returns 若存在则返回 `true`，否则返回 `false`。
   */
  existsByEmail(email: Email, tenantId: TenantId): Promise<boolean>;

  /**
   * @description 检查用户名是否存在。
   * @param username - 用户名值对象。
   * @param tenantId - 租户标识。
   * @returns 若存在则返回 `true`，否则返回 `false`。
   */
  existsByUsername(username: Username, tenantId: TenantId): Promise<boolean>;
}
