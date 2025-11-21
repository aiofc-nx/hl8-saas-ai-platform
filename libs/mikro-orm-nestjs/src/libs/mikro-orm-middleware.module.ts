import {
  Global,
  Inject,
  Module,
  RequestMethod,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';

import type { MikroORM } from '@mikro-orm/core';
import { forRoutesPath } from './middleware.helper.js';
import {
  CONTEXT_NAMES,
  getMikroORMToken,
  MIKRO_ORM_MODULE_OPTIONS,
} from './mikro-orm.common.js';
import { MultipleMikroOrmMiddleware } from './multiple-mikro-orm.middleware.js';
import type { MikroOrmMiddlewareModuleOptions } from './typings.js';

@Global()
@Module({})
export class MikroOrmMiddlewareModule implements NestModule {
  constructor(
    @Inject(MIKRO_ORM_MODULE_OPTIONS)
    private readonly options: MikroOrmMiddlewareModuleOptions,
  ) {
    // 构造函数：注入 MikroORM 中间件模块选项
  }

  /**
   * 配置中间件模块
   *
   * @description 创建中间件模块，提供所有 MikroORM 实例的数组供中间件使用
   * @param options - 中间件模块选项
   * @returns 动态模块，包含 MikroORMs 提供者
   */
  static forRoot(options?: MikroOrmMiddlewareModuleOptions) {
    const inject = CONTEXT_NAMES.map((name) => getMikroORMToken(name));
    return {
      module: MikroOrmMiddlewareModule,
      providers: [
        { provide: MIKRO_ORM_MODULE_OPTIONS, useValue: options || {} },
        {
          provide: 'MikroORMs',
          useFactory: (...args: MikroORM[]) => args,
          inject,
        },
      ],
      exports: ['MikroORMs'],
    };
  }

  /**
   * 配置中间件
   *
   * @description 为所有路由应用多数据库连接的中间件
   * @param consumer - NestJS 中间件消费者对象
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MultipleMikroOrmMiddleware).forRoutes({
      path: forRoutesPath(this.options, consumer),
      method: RequestMethod.ALL,
    });
  }
}
