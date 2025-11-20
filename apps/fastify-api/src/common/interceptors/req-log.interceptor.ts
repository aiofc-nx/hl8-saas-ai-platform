import { concatStr } from '@/common/utils';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 请求日志拦截器，用于记录 HTTP 请求和响应的详细信息。
 *
 * @description 在处理请求之前记录请求方法和 URL。
 * 可选择在处理请求后记录响应状态。
 */
@Injectable()
export class ReqLogInterceptor implements NestInterceptor {
  /**
   * 用于请求日志记录的日志记录器实例。
   *
   * @type {Logger}
   */
  private readonly logger: Logger;

  /**
   * 创建 ReqLogInterceptor 实例。
   */
  constructor() {
    this.logger = new Logger('REQUEST INTERCEPTOR', { timestamp: true });
  }

  /**
   * 拦截传入的 HTTP 请求，在处理前后记录详细信息。
   *
   * @description 拦截 HTTP 请求，记录请求方法和 URL，可选择记录响应状态。
   *
   * @param {ExecutionContext} context - 包含请求/响应信息的执行上下文。
   * @param {CallHandler} next - 用于处理请求的处理器。
   * @returns {Observable<any>} 响应流的 Observable。
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    // 在处理请求前记录请求方法和 URL
    this.logger.log(concatStr([req.method, req.originalUrl]));

    return next.handle().pipe(
      tap(() => {
        // 可选择在处理请求后记录响应详细信息
        // this.logger.log(
        //   concatStr([req.method, req.originalUrl, res.statusCode]),
        // );
      }),
    );
  }
}
