import { CookieOptions } from "express";

export const jwtConfig = {
  accessSecret:
    process.env.ACCESS_TOKEN_SECRET ||
    "default_access_secret_change_me",
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET ||
    "default_refresh_secret_change_me",
  accessExpiresIn: (process.env.ACCESS_TOKEN_EXPIRATION ||
    "15m") as string,
  refreshExpiresIn: (process.env.REFRESH_TOKEN_EXPIRATION ||
    "7d") as string,
  refreshExpiresInMs: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const REFRESH_COOKIE_NAME = "refreshToken";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: jwtConfig.refreshExpiresInMs,
  path: "/api/auth",
};
