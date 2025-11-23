import type { EntityManager } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';

/**
 * 事务服务，用于执行数据库事务操作。
 *
 * @description 提供事务管理功能，确保多个数据库操作要么全部成功，要么全部回滚。
 * 使用 MikroORM 的 EntityManager 来管理事务。
 */
@Injectable()
export class TransactionService {
  /**
   * 创建 TransactionService 实例。
   *
   * @param orm - MikroORM 实例，通过依赖注入获取。
   * 注意：使用 @Inject(MikroORM) 显式注入，以确保能正确解析 PostgreSqlMikroORM 实例。
   */
  constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  /**
   * 获取 EntityManager 实例。
   *
   * @returns {EntityManager} EntityManager 实例。
   */
  private get em(): EntityManager {
    return this.orm.em;
  }

  /**
   * 在事务中运行函数。
   *
   * @description 使用 MikroORM 的事务管理器执行函数。
   * 如果函数执行成功，事务会自动提交；如果抛出异常，事务会自动回滚。
   * 使用泛型类型参数，支持任何 EntityManager 的子类型（如 SqlEntityManager）。
   *
   * @param fn - 接收事务感知的 EntityManager 的函数。
   * @returns 函数返回值的 Promise。
   * @throws 如果函数执行失败，会抛出异常并回滚事务。
   *
   * @example
   * ```typescript
   * await this.transactionService.runInTransaction(async (em) => {
   *   const user = em.create(User, userData);
   *   await em.persistAndFlush(user);
   *   return user;
   * });
   * ```
   */
  async runInTransaction<T, EM extends EntityManager = EntityManager>(
    fn: (manager: EM) => Promise<T>,
  ): Promise<T> {
    return this.em.transactional(async (em) => {
      return fn(em as EM);
    });
  }
}
