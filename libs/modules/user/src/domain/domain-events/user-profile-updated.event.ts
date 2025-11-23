import { DomainEventBase, DomainEventProps } from '@hl8/domain-base';

/**
 * @public
 * @description 用户资料更新事件载荷。
 */
export interface UserProfileUpdatedEventPayload {
  readonly userId: string;
  readonly oldProfile: {
    readonly name: string;
    readonly gender: string;
    readonly phoneNumber: string | null;
    readonly profilePicture: string | null;
    readonly dateOfBirth: string | null;
    readonly address: string | null;
  };
  readonly newProfile: {
    readonly name: string;
    readonly gender: string;
    readonly phoneNumber: string | null;
    readonly profilePicture: string | null;
    readonly dateOfBirth: string | null;
    readonly address: string | null;
  };
}

/**
 * @public
 * @description 用户资料更新领域事件。
 */
export class UserProfileUpdatedEvent extends DomainEventBase {
  public readonly payload: UserProfileUpdatedEventPayload;

  public constructor(
    props: DomainEventProps & { payload: UserProfileUpdatedEventPayload },
  ) {
    super(props);
    this.payload = props.payload;
  }

  public eventName(): string {
    return 'UserProfileUpdatedEvent';
  }
}
