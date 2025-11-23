import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户解锁事件载荷。
 */
export interface UserUnlockedEventPayload {
  readonly userId: string;
}

/**
 * @public
 * @description 用户解锁领域事件。
 */
export class UserUnlockedEvent extends DomainEventBase {
  public readonly payload: UserUnlockedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserUnlockedEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserUnlockedEvent';
  }
}
