import { PrimaryKey, Property } from '@mikro-orm/postgresql';

/**
 * 抽象基础实体类，为所有实体提供公共字段。
 *
 * @description 包含所有实体共有的字段：
 * - id: UUID 主键
 * - createdAt: 创建时间戳
 * - updatedAt: 更新时间戳
 *
 * @abstract
 */
export abstract class Base {
  /**
   * 唯一标识符，使用 UUID 生成。
   *
   * @type {string}
   */
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  /**
   * 实体创建时间戳。
   *
   * @type {Date}
   */
  @Property({ type: 'timestamp', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt: Date = new Date();

  /**
   * 实体最后更新时间戳。
   *
   * @type {Date}
   */
  @Property({
    type: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
