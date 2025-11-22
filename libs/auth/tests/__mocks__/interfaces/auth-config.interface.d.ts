export type AuthConfig = {
  accessTokenSecret: string;
  accessTokenExpiration: string | number;
  refreshTokenSecret: string;
  refreshTokenExpiration: string | number;
  extractUserFromPayload?: (payload: unknown) => unknown;
};
