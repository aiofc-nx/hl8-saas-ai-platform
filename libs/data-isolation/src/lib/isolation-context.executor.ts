import type { ExecutionContext } from '@hl8/application-base';
import { GeneralUnauthorizedException } from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type { IsolationClsStore } from './isolation-cls-store.js';

type LoggerService = InstanceType<typeof Logger>;

/**
 * @description 数据隔离上下文执行器，负责统一校验与设置 CLS 中的隔离上下文信息
 */
@Injectable()
export class IsolationContextExecutor {
  constructor(
    private readonly cls: ClsService<IsolationClsStore>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * @description 获取当前请求的租户标识，缺失时抛出中文异常
   * @returns 当前租户 ID
   * @throws GeneralUnauthorizedException 当 CLS 未写入租户信息时抛出
   * @deprecated 请使用 getExecutionContextOrFail().tenantId
   */
  public getTenantIdOrFail(): string {
    // 优先从 executionContext 获取
    const executionContext = this.cls.get('executionContext');
    if (executionContext?.tenantId) {
      return executionContext.tenantId;
    }

    // 向后兼容：从旧的 tenantId 字段获取
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      this.logger.error('缺少租户上下文，无法解析请求所属租户');
      throw new GeneralUnauthorizedException('缺少租户上下文');
    }
    return tenantId;
  }

  /**
   * @description 获取当前请求的执行上下文，缺失时抛出异常
   * @returns 当前执行上下文
   * @throws GeneralUnauthorizedException 当 CLS 未写入执行上下文时抛出
   */
  public getExecutionContextOrFail(): ExecutionContext {
    const executionContext = this.cls.get('executionContext');
    if (executionContext) {
      return executionContext;
    }

    // 向后兼容：从旧字段构建 ExecutionContext
    const tenantId = this.cls.get('tenantId');
    const userId = this.cls.get('userId');

    if (!tenantId || !userId) {
      this.logger.error('缺少执行上下文，无法解析请求上下文信息');
      throw new GeneralUnauthorizedException('缺少执行上下文');
    }

    return {
      tenantId,
      userId,
    };
  }

  /**
   * @description 在新的 CLS 作用域下执行回调，并预先写入隔离上下文
   * @param executionContext 要注入的执行上下文
   * @param handler 业务回调
   * @returns 回调函数的执行结果
   */
  public async runWithIsolationContext<T>(
    executionContext: ExecutionContext,
    handler: () => Promise<T>,
  ): Promise<T> {
    return this.cls.run(async () => {
      this.cls.set('executionContext', executionContext);
      // 向后兼容：同时设置旧字段
      this.cls.set('tenantId', executionContext.tenantId);
      if (executionContext.userId) {
        this.cls.set('userId', executionContext.userId);
      }
      return handler();
    });
  }

  /**
   * @description 在新的 CLS 作用域下执行回调，并预先写入租户标识（向后兼容）
   * @param tenantId 要注入的租户 ID
   * @param handler 业务回调
   * @param extras 额外的上下文信息
   * @returns 回调函数的执行结果
   * @deprecated 请使用 runWithIsolationContext
   */
  public async runWithTenantContext<T>(
    tenantId: string,
    handler: () => Promise<T>,
    extras?: Partial<IsolationClsStore>,
  ): Promise<T> {
    return this.cls.run(async () => {
      this.cls.set('tenantId', tenantId);
      if (extras?.userId) {
        this.cls.set('userId', extras.userId);
      }
      if (extras?.isolationSnapshot) {
        this.cls.set('isolationSnapshot', extras.isolationSnapshot);
      }
      return handler();
    });
  }
}
