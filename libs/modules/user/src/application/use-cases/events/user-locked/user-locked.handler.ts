import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserLockedEvent } from '../../../../domain/domain-events/user-locked.event.js';

/**
 * @public
 * @description 用户锁定事件处理器，响应 UserLockedEvent 领域事件。
 * @remarks 负责协调用户锁定后的后续业务流程，如发送锁定通知、记录安全日志等。
 */
@Injectable()
@EventsHandler(UserLockedEvent)
export class UserLockedHandler implements IEventHandler<UserLockedEvent> {
  /**
   * @description 处理用户锁定事件。
   * @param event - 用户锁定领域事件。
   * @remarks 当前为占位实现，后续可扩展为发送锁定通知、记录安全日志等。
   */
  public async handle(event: UserLockedEvent): Promise<void> {
    // TODO: 实现用户锁定后的后续业务流程
    // 例如：
    // - 发送锁定通知
    // - 记录安全日志
    // - 更新用户状态统计
    // - 同步到其他系统
    console.log(`用户锁定事件处理: ${event.payload.userId}`, {
      lockedUntil: event.payload.lockedUntil,
    });
  }
}
