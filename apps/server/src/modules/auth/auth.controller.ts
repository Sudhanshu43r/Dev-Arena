import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  registerService,
  loginService,
  refreshSessionService,
  logoutService,
} from "./auth.service.js";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "../../config/jwt.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";

export const handleRegister = asyncHandler(
  async (req: Request, res: Response) => {
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    const { user, tokens } = await registerService(
      req.body as RegisterInput,
      metadata
    );

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);

    return res.status(201).json(
      new ApiResponse(
        201,
        { user, accessToken: tokens.accessToken },
        "User registered successfully"
      )
    );
  }
);

export const handleLogin = asyncHandler(
  async (req: Request, res: Response) => {
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    const { user, tokens } = await loginService(
      req.body as LoginInput,
      metadata
    );

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);

    return res.status(200).json(
      new ApiResponse(
        200,
        { user, accessToken: tokens.accessToken },
        "Login successful"
      )
    );
  }
);

export const handleRefresh = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new ApiError(401, "Refresh token not provided");
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

      const tokens = await refreshSessionService(token, metadata);

      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);

      return res.status(200).json(
        new ApiResponse(
          200,
          { accessToken: tokens.accessToken },
          "Token refreshed successfully"
        )
      );
  }
);

export const handleLogout = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (req.user?.sub) {
        await logoutService(req.user.sub);
      }
    } finally {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  }
);


