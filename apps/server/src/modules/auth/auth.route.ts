import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout
} from "./auth.controller.js";
import { validateBody } from "../../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { jwtVerify } from "../../middleware/auth.middleware.js";
import { rateLimitMiddleware } from "../../middleware/rateLimit.middleware.js";

const authRouter = Router();

const authRateLimiter = rateLimitMiddleware({
  limit: 5,
  windowInSeconds: 60,
});

authRouter
  .route("/register")
  .post(authRateLimiter, validateBody(registerSchema), handleRegister);

authRouter
  .route("/login")
  .post(authRateLimiter, validateBody(loginSchema), handleLogin);

authRouter.route("/refresh").post(handleRefresh);
authRouter.route("/logout").post(jwtVerify, handleLogout);

export { authRouter };

