import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户创建事件。
 */
export interface UserCreatedEventPayload {
  readonly userId: string;
  readonly email: string;
  readonly username: string;
}

/**
 * @public
 * @description 用户创建领域事件。
 */
export class UserCreatedEvent extends DomainEventBase {
  public readonly payload: UserCreatedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserCreatedEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserCreatedEvent';
  }
}
