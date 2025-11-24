import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserActivatedEvent } from '../../../../domain/domain-events/user-activated.event.js';

/**
 * @public
 * @description 用户激活事件处理器，响应 UserActivatedEvent 领域事件。
 * @remarks 负责协调用户激活后的后续业务流程，如发送激活确认通知、更新用户统计等。
 */
@Injectable()
@EventsHandler(UserActivatedEvent)
export class UserActivatedHandler implements IEventHandler<UserActivatedEvent> {
  /**
   * @description 处理用户激活事件。
   * @param event - 用户激活领域事件。
   * @remarks 当前为占位实现，后续可扩展为发送激活确认通知、更新用户统计等。
   */
  public async handle(event: UserActivatedEvent): Promise<void> {
    // TODO: 实现用户激活后的后续业务流程
    // 例如：
    // - 发送激活确认通知
    // - 更新用户统计
    // - 同步到其他系统
    console.log(`用户激活事件处理: ${event.payload.userId}`);
  }
}
