import { Global, Module, type DynamicModule } from '@nestjs/common';
import { ClsModule, type ClsModuleOptions } from 'nestjs-cls';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { IsolationContextExecutor } from './isolation-context.executor.js';

/**
 * @description 数据隔离上下文模块，统一初始化 CLS 并对外暴露数据隔离上下文能力
 */
@Global()
@Module({})
export class IsolationContextModule {
  /**
   * @description 注册 CLS 模块并暴露可选的自定义配置
   * @param options - 可选 CLS 配置，允许覆盖默认中间件行为
   * @returns 动态模块，可在根模块或特性模块中引入
   */
  public static register(options?: ClsModuleOptions): DynamicModule {
    const clsModule = ClsModule.forRoot({
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: IncomingMessage & { id?: string | number }) =>
          req.id?.toString() ?? randomUUID(),
      },
      ...options,
    });

    return {
      module: IsolationContextModule,
      imports: [clsModule],
      providers: [IsolationContextExecutor],
      exports: [clsModule, IsolationContextExecutor],
    };
  }
}
