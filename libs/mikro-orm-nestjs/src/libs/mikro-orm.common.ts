import { MikroORM, Utils } from '@mikro-orm/core';
import { Inject, Logger } from '@nestjs/common';
import type { EntityName } from './typings.js';

export const MIKRO_ORM_MODULE_OPTIONS = Symbol('mikro-orm-module-options');
export const CONTEXT_NAMES: string[] = [];
export const logger = new Logger(MikroORM.name);

/**
 * 获取基于上下文名称的 MikroORM 提供者注入令牌
 *
 * @description 根据数据库连接上下文名称生成对应的 MikroORM 提供者注入令牌
 * @param name - 数据库连接的上下文名称
 * @returns 对应上下文名称的 MikroORM 提供者注入令牌
 */
export const getMikroORMToken = (name: string) => `${name}_MikroORM`;

/**
 * 注入基于上下文名称的 MikroORM 提供者
 *
 * @description 创建一个参数装饰器，用于在 NestJS 中注入指定上下文的 MikroORM 提供者
 * @param name - 数据库连接的上下文名称
 * @returns 参数装饰器，用于注入对应的 MikroORM 提供者
 */
export const InjectMikroORM = (name: string) => Inject(getMikroORMToken(name));

/**
 * 注入 MikroORMs 提供者
 *
 * @description 创建一个参数装饰器，用于在 NestJS 中注入所有 MikroORM 实例的数组
 * @returns 参数装饰器，用于注入 MikroORMs 提供者
 */
export const InjectMikroORMs = () => Inject('MikroORMs');

/**
 * 获取基于上下文名称的 EntityManager 提供者注入令牌
 *
 * @description 根据数据库连接上下文名称生成对应的 EntityManager 提供者注入令牌
 * @param name - 数据库连接的上下文名称
 * @returns 对应上下文名称的 EntityManager 提供者注入令牌
 */
export const getEntityManagerToken = (name: string) => `${name}_EntityManager`;

/**
 * 注入基于上下文名称的 EntityManager 提供者
 *
 * @description 创建一个参数装饰器，用于在 NestJS 中注入指定上下文的 EntityManager 提供者
 * @param name - 数据库连接的上下文名称
 * @returns 参数装饰器，用于注入对应的 EntityManager 提供者
 */
export const InjectEntityManager = (name: string) =>
  Inject(getEntityManagerToken(name));

/**
 * 获取基于实体类和可选上下文名称的 EntityRepository 提供者注入令牌
 *
 * @description 根据实体类和可选的上下文名称生成对应的 EntityRepository 提供者注入令牌
 * @param entity - 用于注入仓库提供者的实体类
 * @param name - 可选的上下文名称，多数据库连接时必需。参见：[多数据库连接](https://mikro-orm.io/docs/usage-with-nestjs#multiple-database-connections)
 * @returns 基于实体类和上下文名称的 EntityRepository 提供者注入令牌
 */
export const getRepositoryToken = <T extends object>(
  entity: EntityName<T>,
  name?: string,
) => {
  const suffix = name ? `_${name}` : '';
  return `${Utils.className(entity)}Repository${suffix}`;
};

/**
 * 注入 EntityRepository 提供者
 *
 * @description 创建一个参数装饰器，用于在 NestJS 中注入指定实体的仓库提供者
 * @param entity - 用于注入仓库提供者的实体类
 * @param name - 可选的上下文名称，多数据库连接时必需。参见：[多数据库连接](https://mikro-orm.io/docs/usage-with-nestjs#multiple-database-connections)
 * @returns 参数装饰器，用于注入对应的 EntityRepository 提供者
 */
export const InjectRepository = <T extends object>(
  entity: EntityName<T>,
  name?: string,
) => Inject(getRepositoryToken(entity, name));
