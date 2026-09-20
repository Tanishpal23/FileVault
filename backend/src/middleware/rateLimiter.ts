import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

interface RateLimitConfig {
  windowMs: number; // Window size in milliseconds
  max: number;      // Max allowed requests per window
  message?: string;
}

// In-memory sliding window rate limiter
const requestLogs = new Map<string, number[]>();

export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.ip}_${req.user?.id || "anon"}_${req.baseUrl || req.path}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const timestamps = (requestLogs.get(key) || []).filter((time) => time > windowStart);

    if (timestamps.length >= config.max) {
      return next(
        ApiError.tooManyRequests(
          config.message || "Too many requests. Please slow down and try again shortly."
        )
      );
    }

    timestamps.push(now);
    requestLogs.set(key, timestamps);

    next();
  };
}

// Pre-configured rate limiters per route category
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                   // 50 attempts
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: "Upload rate limit exceeded. Please try again in an hour.",
});

export const downloadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: "Download rate limit exceeded. Please wait a minute.",
});

export const commentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: "You are posting comments too quickly. Please pause for a moment.",
});
