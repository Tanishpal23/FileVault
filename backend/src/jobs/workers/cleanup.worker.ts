import { JobQueue, Job } from "../JobQueue";
import { prisma } from "../../config/database";
import { storage } from "../../config/storage";

export const cleanupQueue = new JobQueue<{ retentionDays?: number }>("cleanup");

cleanupQueue.process("cleanupExpiredLinks", async () => {
  const now = new Date();
  const result = await prisma.shareLink.updateMany({
    where: {
      expiresAt: { lt: now },
      isRevoked: false,
    },
    data: { isRevoked: true },
  });

  console.log(`🧹 [CleanupWorker] Revoked ${result.count} expired share links.`);
});

cleanupQueue.process("cleanupTrash", async (job: Job<{ retentionDays?: number }>) => {
  const days = job.data?.retentionDays || 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const staleFiles = await prisma.file.findMany({
    where: {
      deletedAt: { lt: cutoff },
    },
    include: {
      versions: true,
    },
  });

  let purgedCount = 0;

  for (const file of staleFiles) {
    try {
      // Delete all storage keys
      await storage.delete(file.storageKey).catch(() => {});
      for (const v of file.versions) {
        await storage.delete(v.storageKey).catch(() => {});
      }

      await prisma.file.delete({
        where: { id: file.id },
      });
      purgedCount++;
    } catch (err) {
      console.error(`Failed to purge stale file ${file.id}:`, err);
    }
  }

  console.log(`🧹 [CleanupWorker] Purged ${purgedCount} stale trash file(s) older than ${days} days.`);
});

cleanupQueue.process("cleanupAbortedUploads", async () => {
  const now = new Date();
  const result = await prisma.uploadSession.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });

  console.log(`🧹 [CleanupWorker] Cleared ${result.count} expired upload sessions.`);
});
