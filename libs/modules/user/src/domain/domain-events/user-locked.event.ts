import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户锁定事件载荷。
 */
export interface UserLockedEventPayload {
  readonly userId: string;
  readonly lockedUntil: string | null;
}

/**
 * @public
 * @description 用户锁定领域事件。
 */
export class UserLockedEvent extends DomainEventBase {
  public readonly payload: UserLockedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserLockedEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserLockedEvent';
  }
}
