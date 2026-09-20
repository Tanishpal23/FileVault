import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { logger } from "./utils/logger";
import { initSocketServer } from "./socket/socketServer";
import { initBackgroundJobScheduler, stopBackgroundJobScheduler } from "./jobs/scheduler";

const server = app.listen(env.PORT, async () => {
  logger.info(`🚀 FileVault API running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`🔗 Health check available at: ${env.API_URL}/health`);

  // Initialize Socket.IO Server
  initSocketServer(server);
  logger.info("⚡ Socket.IO real-time engine initialized");

  // Initialize Background Job Workers & Scheduler
  initBackgroundJobScheduler();

  // Verify Database Connection
  try {
    await prisma.$connect();
    logger.info("📦 PostgreSQL Database connected via Prisma");
  } catch (err: any) {
    logger.warn(
      `⚠️ PostgreSQL connection failed: ${err.message}. Running in local mock mode until database is initialized.`
    );
  }
});

// Graceful Shutdown
const shutdown = async () => {
  logger.info("Gracefully shutting down FileVault API...");
  stopBackgroundJobScheduler();
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
