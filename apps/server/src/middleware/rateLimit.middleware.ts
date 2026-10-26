import type { Request, Response, NextFunction, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { redisClient } from "../config/redis.js";

const INCREMENT_AND_EXPIRE_SCRIPT = `
  local current = redis.call("INCR", KEYS[1])
  if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  else
    local ttl = redis.call("TTL", KEYS[1])
    if ttl == -1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
  end
  local ttl = redis.call("TTL", KEYS[1])
  return { current, ttl }
`;

export interface RateLimitOptions {
  limit: number;
  windowInSeconds: number;
  prefix?: string;
  failOpen?: boolean;
}

export function rateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  const {
    limit,
    windowInSeconds,
    prefix = "rate-limit",
    failOpen = true,
  } = options;

  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null) ??
      req.ip ??
      req.socket.remoteAddress ??
      "unknown-ip";

    const path = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    const identifier = `${path}:${ip}`;
    const key = `${prefix}:${identifier}`;

    let count = 0;
    let ttl = windowInSeconds;

    try {
      const result = (await redisClient.eval(
        INCREMENT_AND_EXPIRE_SCRIPT,
        1,
        key,
        windowInSeconds
      )) as [number, number];

      count = result[0];
      ttl = result[1];
    } catch (error) {
      console.error("Rate limiter Redis evaluation error:", error);
      if (!failOpen) {
        throw new ApiError(500, "Internal rate limit service error");
      }
      return next();
    }

    const remaining = Math.max(0, limit - count);

    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", ttl.toString());

    if (count > limit) {
      res.setHeader("Retry-After", Math.max(0, ttl).toString());
      throw new ApiError(429, "Too many requests. Please try again later.");
    }

    next();
  });
}
