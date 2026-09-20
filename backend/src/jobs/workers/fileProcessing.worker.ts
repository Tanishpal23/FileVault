import { JobQueue, Job } from "../JobQueue";
import { prisma } from "../../config/database";
import { scanner } from "../../scan/ScanProvider";
import { FileStatus } from "@prisma/client";
import { notificationService } from "../../services/notification.service";
import { activityService } from "../../services/activity.service";

export const fileProcessingQueue = new JobQueue<{ fileId: string }>("file-processing");

fileProcessingQueue.process("scanFile", async (job: Job<{ fileId: string }>) => {
  const { fileId } = job.data;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    console.warn(`[FileProcessing] File ${fileId} not found, skipping scan.`);
    return;
  }

  // Update status to PROCESSING
  await prisma.file.update({
    where: { id: fileId },
    data: { status: FileStatus.PROCESSING },
  });

  // Perform security scan
  const scanResult = await scanner.scanObject(file.storageKey);

  if (scanResult.isSafe) {
    await prisma.file.update({
      where: { id: fileId },
      data: { status: FileStatus.AVAILABLE },
    });
    console.log(`🛡️ [ScanProvider] File "${file.name}" verified clean and marked AVAILABLE.`);
  } else {
    await prisma.file.update({
      where: { id: fileId },
      data: { status: FileStatus.QUARANTINED },
    });

    console.warn(`🚨 [ScanProvider] Threat detected in "${file.name}": ${scanResult.threat}! QUARANTINED.`);

    // Notify user
    await notificationService.notify({
      userId: file.ownerId,
      type: "FILE_QUARANTINED",
      title: "Security Threat Quarantined",
      message: `File "${file.name}" contained suspicious code (${scanResult.threat}) and has been quarantined.`,
      payload: { fileId: file.id, threat: scanResult.threat },
    });

    // Record audit activity
    await activityService.logActivity({
      actorId: file.ownerId,
      action: "FILE_QUARANTINED",
      resourceId: file.id,
      resourceType: "FILE",
      resourceName: file.name,
      metadata: { threat: scanResult.threat },
    });
  }
});
