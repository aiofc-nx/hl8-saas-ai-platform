import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedEvent } from '../../../../domain/domain-events/user-created.event.js';

/**
 * @public
 * @description 用户创建事件处理器，响应 UserCreatedEvent 领域事件。
 * @remarks 负责协调用户创建后的后续业务流程，如发送欢迎邮件、初始化用户设置等。
 */
@Injectable()
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  /**
   * @description 处理用户创建事件。
   * @param event - 用户创建领域事件。
   * @remarks 当前为占位实现，后续可扩展为发送欢迎邮件、初始化用户设置等。
   */
  public async handle(event: UserCreatedEvent): Promise<void> {
    // TODO: 实现用户创建后的后续业务流程
    // 例如：
    // - 发送欢迎邮件
    // - 初始化用户设置
    // - 创建用户统计记录
    // - 同步到其他系统
    console.log(`用户创建事件处理: ${event.payload.userId}`, {
      email: event.payload.email,
      username: event.payload.username,
    });
  }
}
