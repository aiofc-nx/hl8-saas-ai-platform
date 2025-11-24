import { GeneralForbiddenException } from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import type {
  EntityData,
  EntityManager,
  EntityName,
  FilterQuery,
  FindOneOptions,
} from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import { IsolationContextExecutor } from '../isolation-context.executor.js';

type LoggerService = InstanceType<typeof Logger>;

/**
 * @description 数据隔离感知仓储基类，自动在查询条件中追加隔离字段（如 tenantId）
 */
export abstract class BaseIsolatedRepository<
  ENTITY extends { tenantId: string },
> {
  protected readonly repository: EntityRepository<ENTITY>;

  protected constructor(
    protected readonly em: EntityManager,
    entityName: EntityName<ENTITY>,
    protected readonly isolationContextExecutor: IsolationContextExecutor,
    protected readonly logger: LoggerService,
  ) {
    this.repository = em.getRepository(entityName);
  }

  protected async findOne(
    where: FilterQuery<ENTITY>,
    options?: FindOneOptions<ENTITY>,
  ): Promise<ENTITY | null> {
    return this.repository.findOne(
      this.mergeIsolationFilter(where),
      options,
    ) as Promise<ENTITY | null>;
  }

  protected async nativeUpdate(
    where: FilterQuery<ENTITY>,
    data: EntityData<ENTITY>,
  ): Promise<number> {
    return this.repository.nativeUpdate(this.mergeIsolationFilter(where), data);
  }

  protected async nativeDelete(where: FilterQuery<ENTITY>): Promise<number> {
    return this.repository.nativeDelete(this.mergeIsolationFilter(where));
  }

  protected getEntityManager(): EntityManager {
    return this.em;
  }

  protected getRepository(): EntityRepository<ENTITY> {
    return this.repository;
  }

  private mergeIsolationFilter(
    where?: FilterQuery<ENTITY>,
  ): FilterQuery<ENTITY> {
    const tenantId = this.isolationContextExecutor.getTenantIdOrFail();
    if (where) {
      const candidate = (where as Record<string, unknown>).tenantId;
      if (
        candidate !== undefined &&
        candidate !== null &&
        candidate !== tenantId
      ) {
        this.logger.error('检测到跨隔离边界访问，已阻止执行', undefined, {
          expectedTenantId: tenantId,
          incomingTenantId: candidate,
        });
        throw new GeneralForbiddenException('禁止跨隔离边界访问');
      }
    }

    const mergedFilter = {
      ...(where as Record<string, unknown> | undefined),
      tenantId,
    };

    this.logger.debug?.('已自动注入数据隔离过滤条件', {
      tenantId,
      repository: this.constructor.name,
    });

    return mergedFilter as FilterQuery<ENTITY>;
  }
}

/**
 * @deprecated 请使用 BaseIsolatedRepository
 */
export const BaseTenantRepository = BaseIsolatedRepository;
