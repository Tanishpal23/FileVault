import { cleanupQueue } from "./workers/cleanup.worker";
import { fileProcessingQueue } from "./workers/fileProcessing.worker";
import { zipQueue } from "./workers/zipGeneration.worker";

let timer: NodeJS.Timeout | null = null;

export function initBackgroundJobScheduler() {
  console.log("⚙️ [BackgroundScheduler] Background workers initialized (Processing, Zip, Cleanups).");

  // Run initial cleanup check
  cleanupQueue.add("cleanupExpiredLinks", {});
  cleanupQueue.add("cleanupAbortedUploads", {});

  // Periodic hourly cleanup trigger
  timer = setInterval(() => {
    cleanupQueue.add("cleanupExpiredLinks", {});
    cleanupQueue.add("cleanupAbortedUploads", {});
    cleanupQueue.add("cleanupTrash", { retentionDays: 30 });
  }, 3600000); // every 1 hour
}

export function stopBackgroundJobScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
