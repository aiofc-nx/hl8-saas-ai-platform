import {
  ConfigurationLoader,
  EntityManager,
  MetadataStorage,
  MikroORM,
  type AnyEntity,
  type EntityClass,
  type EntityClassGroup,
  type EntitySchema,
  type ForkOptions,
} from '@mikro-orm/core';
import {
  MIKRO_ORM_MODULE_OPTIONS,
  getEntityManagerToken,
  getMikroORMToken,
  getRepositoryToken,
  logger,
} from './mikro-orm.common.js';

import {
  Scope,
  type InjectionToken,
  type Provider,
  type Type,
} from '@nestjs/common';
import { MikroOrmEntitiesStorage } from './mikro-orm.entities.storage.js';
import type {
  EntityName,
  MikroOrmModuleAsyncOptions,
  MikroOrmModuleOptions,
  MikroOrmOptionsFactory,
} from './typings.js';

/**
 * 创建 MikroORM 提供者
 *
 * @description 创建 MikroORM 实例的提供者，支持自动加载实体和配置管理
 * @param contextName - 可选的上下文名称，用于多数据库连接场景
 * @param type - MikroORM 类型，默认为核心 MikroORM 类
 * @returns NestJS 提供者对象
 */
export function createMikroOrmProvider(
  contextName?: string,
  type: Type = MikroORM,
): Provider {
  if (!contextName && type !== MikroORM) {
    return {
      provide: type,
      useFactory: (orm) => orm, // just a simple alias
      inject: [MikroORM], // depend on the ORM from core package
    };
  }

  return {
    provide: contextName ? getMikroORMToken(contextName) : type,
    useFactory: async (options?: MikroOrmModuleOptions) => {
      options = { ...options };

      if (options?.autoLoadEntities) {
        options.entities = [
          ...(options.entities || []),
          ...MikroOrmEntitiesStorage.getEntities(contextName),
        ] as (
          | string
          | EntityClass<AnyEntity>
          | EntityClassGroup<AnyEntity>
          | EntitySchema
        )[];
        options.entitiesTs = [
          ...(options.entitiesTs || []),
          ...MikroOrmEntitiesStorage.getEntities(contextName),
        ] as (
          | string
          | EntityClass<AnyEntity>
          | EntityClassGroup<AnyEntity>
          | EntitySchema
        )[];
        delete options.autoLoadEntities;
      }

      if (!options || Object.keys(options).length === 0) {
        const config = await ConfigurationLoader.getConfiguration();
        config.set('logger', logger.log.bind(logger));
        options = config.getAll();
      }

      return MikroORM.init(options);
    },
    inject: [MIKRO_ORM_MODULE_OPTIONS],
  };
}

/**
 * 创建 EntityManager 提供者
 *
 * @description 创建 EntityManager 实例的提供者，支持作用域配置和上下文名称
 * @param scope - NestJS 提供者作用域，默认为 DEFAULT
 * @param entityManager - EntityManager 类型，默认为核心 EntityManager 类
 * @param contextName - 可选的上下文名称，用于多数据库连接场景
 * @param forkOptions - 可选的 Fork 选项，用于创建独立的 EntityManager 实例
 * @returns EntityManager 提供者对象
 */
export function createEntityManagerProvider(
  scope = Scope.DEFAULT,
  entityManager: Type = EntityManager,
  contextName?: string,
  forkOptions?: ForkOptions,
): Provider<EntityManager> {
  if (!contextName && entityManager !== EntityManager) {
    return {
      provide: entityManager,
      scope,
      useFactory: (em: EntityManager) => em, // just a simple alias, unlike `useExisting` from nest, this works with request scopes too
      inject: [EntityManager], // depend on the EM from core package
    };
  }

  return {
    provide: contextName ? getEntityManagerToken(contextName) : entityManager,
    scope,
    useFactory: (orm: MikroORM) =>
      scope === Scope.DEFAULT ? orm.em : orm.em.fork(forkOptions),
    inject: [contextName ? getMikroORMToken(contextName) : MikroORM],
  };
}

/**
 * 创建 MikroORM 异步选项提供者
 *
 * @description 根据异步配置选项创建 MikroORM 模块选项提供者，支持工厂函数、类或现有提供者
 * @param options - MikroORM 模块异步配置选项
 * @returns 模块选项提供者对象
 */
export function createMikroOrmAsyncOptionsProvider(
  options: MikroOrmModuleAsyncOptions,
): Provider {
  if (options.useFactory) {
    return {
      provide: MIKRO_ORM_MODULE_OPTIONS,
      useFactory: async (...args: unknown[]) => {
        const factoryOptions = await options.useFactory!(...args);
        return options.contextName
          ? { contextName: options.contextName, ...factoryOptions }
          : factoryOptions;
      },
      inject: options.inject || [],
    };
  }

  const inject: Array<Type<MikroOrmOptionsFactory>> = [];

  if (options.useClass || options.useExisting) {
    inject.push((options.useClass ?? options.useExisting)!);
  }

  return {
    provide: MIKRO_ORM_MODULE_OPTIONS,
    useFactory: async (optionsFactory: MikroOrmOptionsFactory) =>
      await optionsFactory.createMikroOrmOptions(options.contextName),
    inject,
  };
}

/**
 * 创建异步提供者数组
 *
 * @description 根据异步配置选项创建提供者数组，包括选项提供者和可选的配置工厂类提供者
 * @param options - MikroORM 模块异步配置选项
 * @returns 提供者数组
 * @throws {Error} 当配置选项无效时抛出错误
 */
export function createAsyncProviders(
  options: MikroOrmModuleAsyncOptions,
): Provider[] {
  if (options.useExisting || options.useFactory) {
    return [createMikroOrmAsyncOptionsProvider(options)];
  }

  if (options.useClass) {
    return [
      createMikroOrmAsyncOptionsProvider(options),
      { provide: options.useClass, useClass: options.useClass },
    ];
  }

  throw new Error(
    'Invalid MikroORM async options: one of `useClass`, `useExisting` or `useFactory` should be defined.',
  );
}

/**
 * 创建实体仓库提供者数组
 *
 * @description 为指定的实体类数组创建 EntityRepository 提供者，支持自定义仓库和标准仓库
 * @param entities - 实体类名称数组
 * @param contextName - 可选的上下文名称，用于多数据库连接场景
 * @returns 实体仓库提供者数组
 */
export function createMikroOrmRepositoryProviders(
  entities: EntityName<AnyEntity>[],
  contextName?: string,
): Provider[] {
  const metadata = Object.values(MetadataStorage.getMetadata());
  const providers: Provider[] = [];
  const inject = contextName
    ? getEntityManagerToken(contextName)
    : EntityManager;

  (entities || []).forEach((entity) => {
    const meta = metadata.find((meta) => meta.class === entity);
    const repository = meta?.repository as unknown as
      | (() => InjectionToken)
      | undefined;

    if (repository) {
      providers.push({
        provide: repository(),
        useFactory: (em) => em.getRepository(entity),
        inject: [inject],
      });
    }

    providers.push({
      provide: getRepositoryToken(entity, contextName),
      useFactory: (em) => em.getRepository(entity),
      inject: [inject],
    });
  });

  return providers;
}
