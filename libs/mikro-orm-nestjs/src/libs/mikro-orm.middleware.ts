import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Injectable, type NestMiddleware } from '@nestjs/common';

/**
 * MikroORM 中间件
 *
 * @description 为每个 HTTP 请求自动创建独立的 EntityManager 上下文，确保请求之间的数据隔离
 */
@Injectable()
export class MikroOrmMiddleware implements NestMiddleware {
  constructor(private readonly orm: MikroORM) {
    // 构造函数：注入 MikroORM 实例
  }

  /**
   * 中间件执行方法
   *
   * @description 为当前请求创建独立的 EntityManager 上下文
   * @param req - HTTP 请求对象
   * @param res - HTTP 响应对象
   * @param next - 下一个中间件函数
   */
  use(req: unknown, res: unknown, next: (...args: unknown[]) => void) {
    RequestContext.create(this.orm.em, next);
  }
}
