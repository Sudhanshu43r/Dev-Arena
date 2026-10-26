import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      message: err.message,
      errors: err.errors,
      data: null,
    });
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Validation Error",
      errors,
      data: null,
    });
  }

  // Handle JWT errors if not caught elsewhere
  if (err?.name === "JsonWebTokenError") {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Invalid token",
      errors: [],
      data: null,
    });
  }

  if (err?.name === "TokenExpiredError") {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Token has expired",
      errors: [],
      data: null,
    });
  }

  console.error("Unhandled server error:", err);
  const statusCode = err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errors: [],
    data: null,
  });
};
