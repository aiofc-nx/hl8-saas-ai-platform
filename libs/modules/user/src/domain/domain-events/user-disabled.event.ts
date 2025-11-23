import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户禁用事件载荷。
 */
export interface UserDisabledEventPayload {
  readonly userId: string;
}

/**
 * @public
 * @description 用户禁用领域事件。
 */
export class UserDisabledEvent extends DomainEventBase {
  public readonly payload: UserDisabledEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserDisabledEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserDisabledEvent';
  }
}
