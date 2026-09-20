import { JobQueue, Job } from "../JobQueue";
import { prisma } from "../../config/database";
import { storage } from "../../config/storage";
import { notificationService } from "../../services/notification.service";
import { Writable } from "stream";
import crypto from "crypto";
const { ZipArchive } = require("archiver");

export interface ZipJobData {
  userId: string;
  fileIds: string[];
  zipName?: string;
}

export const zipQueue = new JobQueue<ZipJobData>("zip-generation");

zipQueue.process("generateZip", async (job: Job<ZipJobData>) => {
  const { userId, fileIds, zipName } = job.data;

  const files = await prisma.file.findMany({
    where: {
      id: { in: fileIds },
      deletedAt: null,
    },
  });

  if (files.length === 0) {
    console.warn(`[ZipGeneration] No valid files found to compress for job ${job.id}`);
    return;
  }

  const archiveName = zipName || `FileVault_Archive_${Date.now()}.zip`;
  console.log(`📦 [ZipGeneration] Starting ZIP packaging of ${files.length} file(s) for user ${userId}...`);

  const archive = new ZipArchive({ zlib: { level: 6 } });
  const chunks: Buffer[] = [];

  const bufferStream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  archive.pipe(bufferStream);

  for (const file of files) {
    try {
      const stream = await storage.getObject(file.storageKey);
      archive.append(stream as any, { name: file.name });
    } catch (err) {
      console.error(`Failed to add file "${file.name}" to zip:`, err);
    }
  }

  await archive.finalize();

  await new Promise((resolve) => bufferStream.on("finish", resolve));

  const zipBuffer = Buffer.concat(chunks);
  const zipStorageKey = `users/${userId}/downloads/${Date.now()}_${archiveName}`;

  await storage.upload(zipStorageKey, zipBuffer, "application/zip");
  const downloadUrl = await storage.getSignedDownloadUrl(zipStorageKey, 86400, archiveName);

  console.log(`✅ [ZipGeneration] Successfully generated "${archiveName}" (${zipBuffer.length} bytes)`);

  // Notify user that zip archive is ready
  await notificationService.notify({
    userId,
    type: "ZIP_READY",
    title: "Your ZIP Download is Ready",
    message: `Archived ${files.length} file(s) into "${archiveName}".`,
    payload: {
      downloadUrl,
      fileName: archiveName,
      size: zipBuffer.length,
    },
  });
});
