import { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SanitizedUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  eloRating: number;
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}