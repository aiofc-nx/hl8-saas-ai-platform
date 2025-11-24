import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserUnlockedEvent } from '../../../../domain/domain-events/user-unlocked.event.js';

/**
 * @public
 * @description 用户解锁事件处理器，响应 UserUnlockedEvent 领域事件。
 * @remarks 负责协调用户解锁后的后续业务流程，如发送解锁通知、更新安全状态等。
 */
@Injectable()
@EventsHandler(UserUnlockedEvent)
export class UserUnlockedHandler implements IEventHandler<UserUnlockedEvent> {
  /**
   * @description 处理用户解锁事件。
   * @param event - 用户解锁领域事件。
   * @remarks 当前为占位实现，后续可扩展为发送解锁通知、更新安全状态等。
   */
  public async handle(event: UserUnlockedEvent): Promise<void> {
    // TODO: 实现用户解锁后的后续业务流程
    // 例如：
    // - 发送解锁通知
    // - 更新安全状态
    // - 记录安全日志
    // - 同步到其他系统
    console.log(`用户解锁事件处理: ${event.payload.userId}`);
  }
}
