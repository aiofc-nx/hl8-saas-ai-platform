import type { ExecutionContext as CommonExecutionContext } from '@hl8/application-base';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuditCoordinator } from './audit-coordinator.js';

/**
 * @public
 * @description 查询执行审计拦截器，适用于读操作的 API。
 */
@Injectable()
export class AuditQueryInterceptor implements NestInterceptor {
  public constructor(private readonly auditCoordinator: AuditCoordinator) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      query?: Record<string, unknown>;
      executionContext?: CommonExecutionContext;
      securityContext?: CommonExecutionContext; // 向后兼容
      user?: {
        executionContext?: CommonExecutionContext;
        securityContext?: CommonExecutionContext; // 向后兼容
      };
    }>();
    const executionContext =
      request?.executionContext ??
      request?.securityContext ??
      request?.user?.executionContext ??
      request?.user?.securityContext;
    if (!executionContext) {
      return next.handle();
    }

    const action = context.getHandler()?.name ?? 'UnknownQuery';
    return next.handle().pipe(
      mergeMap(async (result) => {
        await this.auditCoordinator.record(executionContext, {
          tenantId: executionContext.tenantId,
          userId: executionContext.userId,
          action,
          payload: request?.query,
          result,
          metadata: { channel: 'query' },
        });
        return result;
      }),
    );
  }
}
