import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserDisabledEvent } from '../../../../domain/domain-events/user-disabled.event.js';

/**
 * @public
 * @description 用户禁用事件处理器，响应 UserDisabledEvent 领域事件。
 * @remarks 负责协调用户禁用后的后续业务流程，如撤销用户权限、发送禁用通知等。
 */
@Injectable()
@EventsHandler(UserDisabledEvent)
export class UserDisabledHandler implements IEventHandler<UserDisabledEvent> {
  /**
   * @description 处理用户禁用事件。
   * @param event - 用户禁用领域事件。
   * @remarks 当前为占位实现，后续可扩展为撤销用户权限、发送禁用通知等。
   */
  public async handle(event: UserDisabledEvent): Promise<void> {
    // TODO: 实现用户禁用后的后续业务流程
    // 例如：
    // - 撤销用户权限
    // - 发送禁用通知
    // - 记录安全日志
    // - 同步到其他系统
    console.log(`用户禁用事件处理: ${event.payload.userId}`);
  }
}
