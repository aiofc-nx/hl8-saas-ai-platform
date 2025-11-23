import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户激活事件载荷。
 */
export interface UserActivatedEventPayload {
  readonly userId: string;
}

/**
 * @public
 * @description 用户激活领域事件。
 */
export class UserActivatedEvent extends DomainEventBase {
  public readonly payload: UserActivatedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserActivatedEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserActivatedEvent';
  }
}
