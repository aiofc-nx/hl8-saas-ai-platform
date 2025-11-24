export declare class GeneralBadRequestException extends Error {
  readonly status: number;
  readonly data?: unknown;
  constructor(issues?: unknown, detail?: string, errorCode?: string);
}
export declare class GeneralForbiddenException extends Error {
  readonly status: number;
  constructor(detail?: string, errorCode?: string);
}
