import { GeneralForbiddenException } from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import type { EntityName, EventArgs, EventSubscriber } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Injectable, Optional } from '@nestjs/common';
import { TenantContextExecutor } from '../tenant-context.executor.js';

type LoggerService = InstanceType<typeof Logger>;

/**
 * @description 租户感知订阅器配置选项
 */
export interface TenantAwareSubscriberOptions {
  /**
   * @description 数据库连接名称，默认为 'postgres'
   */
  connectionName?: string;
}

/**
 * @description MikroORM 订阅器：在实体持久化前自动写入租户信息
 */
@Injectable()
export class TenantAwareSubscriber
  implements
    EventSubscriber<{
      tenantId?: string;
    }>
{
  constructor(
    private readonly tenantExecutor: TenantContextExecutor,
    private readonly logger: LoggerService,
    @InjectEntityManager('postgres') entityManager: EntityManager,
    @Optional() private readonly options?: TenantAwareSubscriberOptions,
  ) {
    entityManager.getEventManager().registerSubscriber(this);
  }

  public getSubscribedEntities(): EntityName<{ tenantId?: string }>[] {
    return [];
  }

  /**
   * @description 在实体创建前自动写入租户信息或校验租户一致性
   * @param args 实体创建事件参数
   * @throws GeneralForbiddenException 当实体租户 ID 与上下文不一致时抛出
   */
  public async beforeCreate(
    args: EventArgs<{ tenantId?: string }>,
  ): Promise<void> {
    const tenantId = this.tenantExecutor.getTenantIdOrFail();

    if (!args.entity.tenantId) {
      args.entity.tenantId = tenantId;
      this.logger.debug('自动写入租户 ID', {
        entity: args.entity.constructor.name,
        tenantId,
      });
      return;
    }

    if (args.entity.tenantId !== tenantId) {
      this.logger.error('实体租户 ID 与上下文不一致', undefined, {
        entity: args.entity.constructor.name,
        expectedTenantId: tenantId,
        incomingTenantId: args.entity.tenantId,
      });
      throw new GeneralForbiddenException('禁止跨租户写入');
    }
  }

  /**
   * @description 在实体更新前校验租户一致性
   * @param args 实体更新事件参数
   * @throws GeneralForbiddenException 当实体租户 ID 与上下文不一致时抛出
   */
  public async beforeUpdate(
    args: EventArgs<{ tenantId?: string }>,
  ): Promise<void> {
    const tenantId = this.tenantExecutor.getTenantIdOrFail();
    const updatingTenantId = args.entity.tenantId;

    if (updatingTenantId && updatingTenantId !== tenantId) {
      this.logger.error('检测到跨租户更新尝试', undefined, {
        entity: args.entity.constructor.name,
        expectedTenantId: tenantId,
        incomingTenantId: updatingTenantId,
      });
      throw new GeneralForbiddenException('禁止跨租户访问');
    }
  }
}
