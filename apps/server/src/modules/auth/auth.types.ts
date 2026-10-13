export interface AccessTokenPayload {
  sub: string;
  role: "USER" | "ADMIN";
}