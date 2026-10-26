import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.route.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Auth Routes
app.use("/api/auth", authRouter);

//Fallback 404 handler for unmatched routes
app.use((req,res,next)=>{
     next(new ApiError(404, `route of methos ${req.method} and url ${req.originalUrl} not found`));
})

// Centralized Error Handling
app.use(errorHandler);

export { app };
