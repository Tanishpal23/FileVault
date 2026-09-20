import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { AuthenticatedUser } from "../types/express";

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return next(ApiError.unauthorized("Authentication required", "NO_TOKEN"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      storageQuota: "10737418240",
      storageUsed: "0",
    };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Token expired", "TOKEN_EXPIRED"));
    }
    return next(ApiError.unauthorized("Invalid token", "INVALID_TOKEN"));
  }
}
