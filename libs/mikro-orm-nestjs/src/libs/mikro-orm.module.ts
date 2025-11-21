import { Utils, type AnyEntity } from '@mikro-orm/core';
import { Module, type DynamicModule } from '@nestjs/common';
import { MikroOrmCoreModule } from './mikro-orm-core.module.js';
import { MikroOrmMiddlewareModule } from './mikro-orm-middleware.module.js';
import { MikroOrmEntitiesStorage } from './mikro-orm.entities.storage.js';
import { createMikroOrmRepositoryProviders } from './mikro-orm.providers.js';
import {
  EntityName,
  MaybePromise,
  MikroOrmMiddlewareModuleOptions,
  MikroOrmModuleAsyncOptions,
  MikroOrmModuleFeatureOptions,
  MikroOrmModuleSyncOptions,
} from './typings.js';

/**
 * MikroORM NestJS 模块
 *
 * @description 提供 MikroORM 与 NestJS 框架的集成支持，包括数据库连接管理、实体仓库注入等功能
 */
@Module({})
export class MikroOrmModule {
  /**
   * 清除实体存储
   *
   * @description 清除实体存储，用于测试场景中隔离测试。在使用保持上下文存活的测试运行器时（如禁用线程的 Vitest），应在测试之间调用此方法
   * @param contextName - 可选的上下文名称，用于清除特定上下文的实体存储
   */
  static clearStorage(contextName?: string) {
    MikroOrmEntitiesStorage.clear(contextName);
  }

  /**
   * 配置 MikroORM 根模块（同步方式）
   *
   * @description 使用同步配置方式初始化 MikroORM 模块，支持单个或多个数据库连接
   * @param options - MikroORM 模块同步配置选项，可以是单个配置对象或配置数组
   * @returns 动态模块，包含 MikroORM 和 EntityManager 提供者
   */
  static forRoot(
    options?: MikroOrmModuleSyncOptions,
  ): MaybePromise<DynamicModule>;
  static forRoot(
    options?: MikroOrmModuleSyncOptions[],
  ): MaybePromise<DynamicModule>[];
  static forRoot(
    options?: MikroOrmModuleSyncOptions | MikroOrmModuleSyncOptions[],
  ): MaybePromise<DynamicModule> | MaybePromise<DynamicModule>[] {
    if (Array.isArray(options)) {
      return options.map((o) => MikroOrmCoreModule.forRoot(o));
    }

    return MikroOrmCoreModule.forRoot(options);
  }

  /**
   * 配置 MikroORM 根模块（异步方式）
   *
   * @description 使用异步配置方式初始化 MikroORM 模块，支持从配置服务、工厂函数等方式加载配置，支持单个或多个数据库连接
   * @param options - MikroORM 模块异步配置选项，可以是单个配置对象或配置数组
   * @returns 动态模块，包含 MikroORM 和 EntityManager 提供者
   */
  static forRootAsync(
    options: MikroOrmModuleAsyncOptions,
  ): MaybePromise<DynamicModule>;
  static forRootAsync(
    options: MikroOrmModuleAsyncOptions[],
  ): MaybePromise<DynamicModule>[];
  static forRootAsync(
    options: MikroOrmModuleAsyncOptions | MikroOrmModuleAsyncOptions[],
  ): MaybePromise<DynamicModule> | MaybePromise<DynamicModule>[] {
    if (Array.isArray(options)) {
      return options.map((o) => MikroOrmCoreModule.forRootAsync(o));
    }

    return MikroOrmCoreModule.forRootAsync(options);
  }

  /**
   * 注册实体特性模块
   *
   * @description 为指定的实体类注册 EntityRepository 提供者，使其可以在服务中通过依赖注入使用
   * @param options - 实体类数组或特性模块选项对象
   * @param contextName - 可选的上下文名称，用于多数据库连接场景
   * @returns 动态模块，包含实体仓库提供者
   */
  static forFeature(
    options: EntityName<AnyEntity>[] | MikroOrmModuleFeatureOptions,
    contextName?: string,
  ): DynamicModule {
    const entities = Array.isArray(options) ? options : options.entities || [];
    const name =
      Array.isArray(options) || contextName ? contextName : options.contextName;
    const providers = createMikroOrmRepositoryProviders(entities, name);

    for (const e of entities) {
      if (!Utils.isString(e)) {
        MikroOrmEntitiesStorage.addEntity(e, name);
      }
    }

    return {
      module: MikroOrmModule,
      providers: [...providers],
      exports: [...providers],
    };
  }

  /**
   * 注册 MikroORM 中间件模块
   *
   * @description 注册请求上下文中间件，自动为每个 HTTP 请求创建独立的 EntityManager 上下文
   * @param options - 中间件模块选项，可配置路由路径等
   * @returns 动态模块，包含中间件提供者
   */
  static forMiddleware(
    options?: MikroOrmMiddlewareModuleOptions,
  ): DynamicModule {
    return MikroOrmMiddlewareModule.forRoot(options);
  }
}
