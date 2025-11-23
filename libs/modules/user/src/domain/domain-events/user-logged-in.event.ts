import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户登录事件载荷。
 */
export interface UserLoggedInEventPayload {
  readonly userId: string;
  readonly loginAt: string;
}

/**
 * @public
 * @description 用户登录领域事件。
 */
export class UserLoggedInEvent extends DomainEventBase {
  public readonly payload: UserLoggedInEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserLoggedInEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserLoggedInEvent';
  }
}
