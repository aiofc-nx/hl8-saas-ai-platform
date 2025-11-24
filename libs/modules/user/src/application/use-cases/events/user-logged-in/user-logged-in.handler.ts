import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserLoggedInEvent } from '../../../../domain/domain-events/user-logged-in.event.js';

/**
 * @public
 * @description 用户登录事件处理器，响应 UserLoggedInEvent 领域事件。
 * @remarks 负责协调用户登录后的后续业务流程，如记录登录日志、更新用户活跃度等。
 */
@Injectable()
@EventsHandler(UserLoggedInEvent)
export class UserLoggedInHandler implements IEventHandler<UserLoggedInEvent> {
  /**
   * @description 处理用户登录事件。
   * @param event - 用户登录领域事件。
   * @remarks 当前为占位实现，后续可扩展为记录登录日志、更新用户活跃度等。
   */
  public async handle(event: UserLoggedInEvent): Promise<void> {
    // TODO: 实现用户登录后的后续业务流程
    // 例如：
    // - 记录登录日志
    // - 更新用户活跃度
    // - 发送登录通知（如异地登录）
    // - 同步到其他系统
    console.log(`用户登录事件处理: ${event.payload.userId}`, {
      loginAt: event.payload.loginAt,
    });
  }
}
