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
 * @description 命令执行审计拦截器，适用于基于控制器触发的命令请求。
 */
@Injectable()
export class AuditCommandInterceptor implements NestInterceptor {
  public constructor(private readonly auditCoordinator: AuditCoordinator) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      body?: Record<string, unknown>;
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

    const action = context.getHandler()?.name ?? 'UnknownCommand';
    return next.handle().pipe(
      mergeMap(async (result) => {
        await this.auditCoordinator.record(executionContext, {
          tenantId: executionContext.tenantId,
          userId: executionContext.userId,
          action,
          payload: request?.body,
          result,
          metadata: { channel: 'command' },
        });
        return result;
      }),
    );
  }
}
