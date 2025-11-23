import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户密码变更事件载荷。
 */
export interface UserPasswordChangedEventPayload {
  readonly userId: string;
}

/**
 * @public
 * @description 用户密码变更领域事件。
 */
export class UserPasswordChangedEvent extends DomainEventBase {
  public readonly payload: UserPasswordChangedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserPasswordChangedEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserPasswordChangedEvent';
  }
}
