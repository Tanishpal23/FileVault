import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { requestIdMiddleware } from "./middleware/requestId";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import storageRoutes from "./routes/storage.routes";
import folderRoutes from "./routes/folder.routes";
import fileRoutes from "./routes/file.routes";
import uploadRoutes from "./routes/upload.routes";
import sharingRoutes from "./routes/sharing.routes";
import publicSharedRoutes from "./routes/publicShared.routes";
import trashRoutes from "./routes/trash.routes";
import versionRoutes from "./routes/version.routes";
import searchRoutes from "./routes/search.routes";
import notificationRoutes from "./routes/notification.routes";
import activityRoutes from "./routes/activity.routes";
import commentRoutes from "./routes/comment.routes";
import commentsDirectRoutes from "./routes/comments-direct.routes";
import { authRateLimiter, uploadRateLimiter, commentRateLimiter } from "./middleware/rateLimiter";

export const app = express();

// Trust proxy for secure cookies and rate limiting
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  })
);

app.use(cookieParser());
app.use(requestIdMiddleware);

// JSON body parser (except for streaming mock storage endpoints)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/storage/mock")) {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "filevault-api",
  });
});

// API Routes
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/files", versionRoutes);
app.use("/api/files", sharingRoutes);
app.use("/api/shares", sharingRoutes);
app.use("/api/uploads", uploadRateLimiter, uploadRoutes);
app.use("/api/shared", publicSharedRoutes);
app.use("/api/trash", trashRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/files/:fileId/comments", commentRateLimiter, commentRoutes);
app.use("/api/comments", commentRateLimiter, commentsDirectRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested API endpoint does not exist.",
    },
  });
});

// Centralized Error Handler
app.use(errorHandler);
