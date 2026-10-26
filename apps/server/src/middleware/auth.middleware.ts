import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { jwtConfig } from "../config/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AccessTokenPayload } from "../modules/auth/auth.types.js";

export const jwtVerify = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token missing or malformed");
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwt.verify(
        token,
        jwtConfig.accessSecret
      ) as AccessTokenPayload;

      req.user = payload;
      return next();
    } catch (error: any) {
      if (error?.name === "TokenExpiredError") {
        throw new ApiError(401, "Access token has expired");
      }
      throw new ApiError(401, "Invalid access token");
    }
  }
);

export const requireRoles = (...allowedRoles: Role[]) => {
  return asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(403, "Forbidden: insufficient permissions");
      }

      return next();
    }
  );
};
