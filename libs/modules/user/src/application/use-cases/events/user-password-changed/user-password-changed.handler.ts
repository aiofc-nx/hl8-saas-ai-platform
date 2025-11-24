import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserPasswordChangedEvent } from '../../../../domain/domain-events/user-password-changed.event.js';

/**
 * @public
 * @description 用户密码变更事件处理器，响应 UserPasswordChangedEvent 领域事件。
 * @remarks 负责协调用户密码变更后的后续业务流程，如发送密码变更通知、记录安全日志等。
 */
@Injectable()
@EventsHandler(UserPasswordChangedEvent)
export class UserPasswordChangedHandler
  implements IEventHandler<UserPasswordChangedEvent>
{
  /**
   * @description 处理用户密码变更事件。
   * @param event - 用户密码变更领域事件。
   * @remarks 当前为占位实现，后续可扩展为发送密码变更通知、记录安全日志等。
   */
  public async handle(event: UserPasswordChangedEvent): Promise<void> {
    // TODO: 实现用户密码变更后的后续业务流程
    // 例如：
    // - 发送密码变更通知
    // - 记录安全日志
    // - 撤销其他设备的登录会话
    // - 同步到其他系统
    console.log(`用户密码变更事件处理: ${event.payload.userId}`);
  }
}
