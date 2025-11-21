import {
  Configuration,
  ConfigurationLoader,
  EntityManager,
  MikroORM,
  type Dictionary,
} from '@mikro-orm/core';
import {
  Global,
  Inject,
  Module,
  RequestMethod,
  type DynamicModule,
  type MiddlewareConsumer,
  type NestModule,
  type OnApplicationShutdown,
  type Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { forRoutesPath } from './middleware.helper.js';
import {
  CONTEXT_NAMES,
  getEntityManagerToken,
  getMikroORMToken,
  MIKRO_ORM_MODULE_OPTIONS,
} from './mikro-orm.common.js';
import { MikroOrmEntitiesStorage } from './mikro-orm.entities.storage.js';
import { MikroOrmMiddleware } from './mikro-orm.middleware.js';
import {
  createAsyncProviders,
  createEntityManagerProvider,
  createMikroOrmProvider,
} from './mikro-orm.providers.js';
import type {
  MikroOrmModuleAsyncOptions,
  MikroOrmModuleOptions,
  MikroOrmModuleSyncOptions,
} from './typings.js';

async function tryRequire(name: string): Promise<Dictionary | undefined> {
  try {
    return await import(name);
  } catch {
    return undefined; // ignore, optional dependency
  }
}

// TODO: provide the package name via some platform method, prefer that over the static map when available
const PACKAGES = {
  MongoDriver: '@mikro-orm/mongodb',
  MySqlDriver: '@mikro-orm/mysql',
  MsSqlDriver: '@mikro-orm/mssql',
  MariaDbDriver: '@mikro-orm/mariadb',
  PostgreSqlDriver: '@mikro-orm/postgresql',
  SqliteDriver: '@mikro-orm/sqlite',
  LibSqlDriver: '@mikro-orm/libsql',
  BetterSqliteDriver: '@mikro-orm/better-sqlite',
} as const;

/**
 * MikroORM 核心模块
 *
 * @description 提供 MikroORM 的核心功能，包括数据库连接管理、EntityManager 提供、请求上下文注册等
 */
@Global()
@Module({})
export class MikroOrmCoreModule implements NestModule, OnApplicationShutdown {
  constructor(
    @Inject(MIKRO_ORM_MODULE_OPTIONS)
    private readonly options: MikroOrmModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

  static async forRoot(
    options?: MikroOrmModuleSyncOptions,
  ): Promise<DynamicModule> {
    const contextName = this.setContextName(options?.contextName);

    if (options?.driver && !contextName) {
      const packageName =
        PACKAGES[options.driver.name as keyof typeof PACKAGES];
      const driverPackage = await tryRequire(packageName);

      if (driverPackage) {
        return {
          module: MikroOrmCoreModule,
          providers: [
            { provide: MIKRO_ORM_MODULE_OPTIONS, useValue: options || {} },
            createMikroOrmProvider(contextName),
            createMikroOrmProvider(contextName, driverPackage.MikroORM),
            createEntityManagerProvider(options?.scope, EntityManager),
            createEntityManagerProvider(
              options?.scope,
              driverPackage.EntityManager,
            ),
          ],
          exports: [
            MikroORM,
            EntityManager,
            driverPackage.EntityManager,
            driverPackage.MikroORM,
          ],
        };
      }
    }

    const knex = await tryRequire('@mikro-orm/knex');
    const mongo = await tryRequire('@mikro-orm/mongodb');
    const em = await this.createEntityManager(options);

    if (em && !contextName) {
      const packageName =
        PACKAGES[em.getDriver().constructor.name as keyof typeof PACKAGES];
      const driverPackage = await tryRequire(packageName);

      if (driverPackage) {
        return {
          module: MikroOrmCoreModule,
          providers: [
            { provide: MIKRO_ORM_MODULE_OPTIONS, useValue: options || {} },
            createMikroOrmProvider(contextName),
            createMikroOrmProvider(contextName, driverPackage.MikroORM),
            createEntityManagerProvider(options?.scope, EntityManager),
            createEntityManagerProvider(
              options?.scope,
              driverPackage.EntityManager,
            ),
          ],
          exports: [
            MikroORM,
            EntityManager,
            driverPackage.EntityManager,
            driverPackage.MikroORM,
          ],
        };
      }
    }

    return {
      module: MikroOrmCoreModule,
      providers: [
        { provide: MIKRO_ORM_MODULE_OPTIONS, useValue: options || {} },
        createMikroOrmProvider(contextName),
        ...(mongo ? [createMikroOrmProvider(contextName, mongo.MikroORM)] : []),
        createEntityManagerProvider(options?.scope, EntityManager, contextName),
        ...(em
          ? [
              createEntityManagerProvider(
                options?.scope,
                em.constructor as Type,
                contextName,
              ),
            ]
          : []),
        ...(knex
          ? [
              createEntityManagerProvider(
                options?.scope,
                knex.EntityManager,
                contextName,
              ),
            ]
          : []),
        ...(mongo
          ? [
              createEntityManagerProvider(
                options?.scope,
                mongo.EntityManager,
                contextName,
              ),
            ]
          : []),
      ],
      exports: [
        contextName ? getMikroORMToken(contextName) : MikroORM,
        contextName ? getEntityManagerToken(contextName) : EntityManager,
        ...(em && !contextName ? [em.constructor] : []),
        ...(knex && !contextName ? [knex.EntityManager] : []),
        ...(mongo && !contextName ? [mongo.EntityManager, mongo.MikroORM] : []),
      ],
    };
  }

  /**
   * 配置 MikroORM 核心模块（异步方式）
   *
   * @description 使用异步配置方式初始化 MikroORM 核心模块，支持从配置服务、工厂函数等方式加载配置
   * @param options - MikroORM 模块异步配置选项
   * @returns 动态模块，包含 MikroORM、EntityManager 等提供者
   */
  static async forRootAsync(
    options: MikroOrmModuleAsyncOptions,
  ): Promise<DynamicModule> {
    const contextName = this.setContextName(options?.contextName);

    if (options?.driver && !contextName) {
      const packageName =
        PACKAGES[options.driver.name as keyof typeof PACKAGES];
      const driverPackage = await tryRequire(packageName);

      if (driverPackage) {
        return {
          module: MikroOrmCoreModule,
          imports: options.imports || [],
          providers: [
            ...(options.providers || []),
            ...createAsyncProviders({
              ...options,
              contextName: options.contextName,
            }),
            createMikroOrmProvider(contextName),
            createMikroOrmProvider(contextName, driverPackage.MikroORM),
            createEntityManagerProvider(options?.scope, EntityManager),
            createEntityManagerProvider(
              options?.scope,
              driverPackage.EntityManager,
            ),
          ],
          exports: [
            MikroORM,
            EntityManager,
            driverPackage.EntityManager,
            driverPackage.MikroORM,
          ],
        };
      }
    }

    const knex = await tryRequire('@mikro-orm/knex');
    const mongo = await tryRequire('@mikro-orm/mongodb');
    const em = await this.createEntityManager(options);

    if (em && !contextName) {
      const packageName =
        PACKAGES[em.getDriver().constructor.name as keyof typeof PACKAGES];
      const driverPackage = await tryRequire(packageName);

      if (driverPackage) {
        return {
          module: MikroOrmCoreModule,
          imports: options.imports || [],
          providers: [
            ...(options.providers || []),
            ...createAsyncProviders({
              ...options,
              contextName: options.contextName,
            }),
            createMikroOrmProvider(contextName),
            createMikroOrmProvider(contextName, driverPackage.MikroORM),
            createEntityManagerProvider(options?.scope, EntityManager),
            createEntityManagerProvider(
              options?.scope,
              driverPackage.EntityManager,
            ),
          ],
          exports: [
            MikroORM,
            EntityManager,
            driverPackage.EntityManager,
            driverPackage.MikroORM,
          ],
        };
      }
    }

    return {
      module: MikroOrmCoreModule,
      imports: options.imports || [],
      providers: [
        ...(options.providers || []),
        ...createAsyncProviders({
          ...options,
          contextName: options.contextName,
        }),
        createMikroOrmProvider(contextName),
        ...(mongo ? [createMikroOrmProvider(contextName, mongo.MikroORM)] : []),
        createEntityManagerProvider(options.scope, EntityManager, contextName),
        ...(em
          ? [
              createEntityManagerProvider(
                options?.scope,
                em.constructor as Type,
                contextName,
              ),
            ]
          : []),
        ...(knex
          ? [
              createEntityManagerProvider(
                options?.scope,
                knex.EntityManager,
                contextName,
              ),
            ]
          : []),
        ...(mongo
          ? [
              createEntityManagerProvider(
                options?.scope,
                mongo.EntityManager,
                contextName,
              ),
            ]
          : []),
      ],
      exports: [
        contextName ? getMikroORMToken(contextName) : MikroORM,
        contextName ? getEntityManagerToken(contextName) : EntityManager,
        ...(em && !contextName ? [em.constructor] : []),
        ...(knex && !contextName ? [knex.EntityManager] : []),
        ...(mongo && !contextName ? [mongo.EntityManager, mongo.MikroORM] : []),
      ],
    };
  }

  /**
   * 尝试创建驱动实例以使用实际的实体管理器实现
   *
   * @description 尝试创建驱动实例，以便在依赖注入中使用实际的实体管理器实现（如 `SqlEntityManager`），
   * 这有助于解决从驱动包导入 EntityManager 时的依赖解析问题
   * @param options - MikroORM 模块同步或异步配置选项
   * @returns EntityManager 实例或 undefined
   */
  private static async createEntityManager(
    options?: MikroOrmModuleSyncOptions | MikroOrmModuleAsyncOptions,
  ): Promise<EntityManager | undefined> {
    if (options?.contextName) {
      return undefined;
    }

    try {
      let config;

      if (!options || Object.keys(options).length === 0) {
        config = await ConfigurationLoader.getConfiguration(false);
      }

      if (!config && 'useFactory' in options!) {
        config = new Configuration(await options.useFactory!(), false);
      }

      if (!config && options instanceof Configuration) {
        config = options;
      }

      if (
        !config &&
        typeof options === 'object' &&
        options &&
        'driver' in options
      ) {
        config = new Configuration(options, false);
      }

      return config?.getDriver().createEntityManager();
    } catch {
      if (
        options &&
        'useFactory' in options &&
        'inject' in options &&
        !options.driver &&
        (options.inject as unknown[]).length > 0
      ) {
        // 警告：使用 `useFactory` 和 `inject` 定义的模块需要显式的 `driver` 选项才能支持特定驱动导入
        // See https://github.com/mikro-orm/nestjs/pull/204
        // 注意：在生产环境中应使用 Logger 而不是 console
      }
    }
  }

  /**
   * 应用关闭时的清理方法
   *
   * @description 在应用关闭时关闭 MikroORM 连接并清理资源
   */
  async onApplicationShutdown() {
    const token = this.options.contextName
      ? getMikroORMToken(this.options.contextName)
      : MikroORM;
    const orm = this.moduleRef.get(token);

    if (orm) {
      await orm.close();
      MikroOrmEntitiesStorage.clearLater();
    }

    CONTEXT_NAMES.length = 0;
  }

  /**
   * 配置中间件
   *
   * @description 配置请求上下文中间件，自动为每个 HTTP 请求注册独立的 EntityManager 上下文
   * @param consumer - NestJS 中间件消费者对象
   */
  configure(consumer: MiddlewareConsumer): void {
    if (this.options.registerRequestContext === false) {
      return;
    }

    consumer
      .apply(MikroOrmMiddleware) // 自动注册请求上下文
      .forRoutes({
        path: forRoutesPath(this.options, consumer),
        method: RequestMethod.ALL,
      });
  }

  /**
   * 设置上下文名称
   *
   * @description 设置并验证数据库连接的上下文名称，确保上下文名称唯一
   * @param contextName - 上下文名称
   * @returns 上下文名称或 undefined
   * @throws {Error} 当上下文名称已注册时抛出错误
   */
  private static setContextName(contextName?: string) {
    if (!contextName) {
      return;
    }

    if (CONTEXT_NAMES.includes(contextName)) {
      throw new Error(`ContextName '${contextName}' already registered`);
    }

    CONTEXT_NAMES.push(contextName);

    return contextName;
  }
}
