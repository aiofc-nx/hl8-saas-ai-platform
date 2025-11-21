/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

/**
 * 日志错误拦截器
 *
 * @description NestJS 拦截器，用于捕获请求处理过程中的错误并将其绑定到响应对象上。
 * 这样可以让 Pino HTTP 中间件在记录响应日志时包含错误信息。
 *
 * 主要功能：
 * - 自动捕获请求处理过程中的错误
 * - 将错误信息绑定到响应对象（支持 Fastify 和 Express）
 * - 保持错误传播链的完整性
 *
 * @example
 * ```typescript
 * // 全局注册
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: LoggerErrorInterceptor,
 *     },
 *   ],
 * })
 * export class AppModule {}
 *
 * // 或者在 bootstrap 中注册
 * app.useGlobalInterceptors(new LoggerErrorInterceptor());
 * ```
 */
@Injectable()
export class LoggerErrorInterceptor implements NestInterceptor {
  /**
   * 拦截请求处理
   *
   * @description 拦截 HTTP 请求处理过程，捕获错误并将其绑定到响应对象上。
   * 支持 Fastify 和 Express 两种 HTTP 适配器。
   *
   * @param context - 执行上下文，包含请求和响应信息
   * @param next - 请求处理器，用于继续处理请求
   * @returns 响应流的 Observable，如果发生错误会在响应对象上绑定错误信息
   *
   * @example
   * ```typescript
   * // 当请求处理过程中发生错误时
   * // 错误会被自动绑定到 response.err（Express）或 response.raw.err（Fastify）
   * // Pino HTTP 中间件会在记录响应日志时自动包含错误信息
   * ```
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((error) => {
        return throwError(() => {
          const response = context.switchToHttp().getResponse();

          const isFastifyResponse = response.raw !== undefined;

          if (isFastifyResponse) {
            response.raw.err = error;
          } else {
            response.err = error;
          }

          return error;
        });
      }),
    );
  }
}
