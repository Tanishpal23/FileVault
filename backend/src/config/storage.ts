import { env } from "./env";
import { StorageProvider } from "../storage/StorageProvider";
import { R2StorageProvider } from "../storage/R2StorageProvider";
import { MockStorageProvider } from "../storage/MockStorageProvider";

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const hasR2Config =
    (Boolean(env.R2_ACCOUNT_ID) || Boolean(env.R2_ENDPOINT)) &&
    Boolean(env.R2_ACCESS_KEY_ID) &&
    Boolean(env.R2_SECRET_ACCESS_KEY);

  if (hasR2Config) {
    const isB2 = env.R2_ENDPOINT?.includes("backblazeb2.com");
    console.log(`☁️  Using ${isB2 ? "Backblaze B2" : "Cloudflare R2"} S3 Storage Provider`);
    storageInstance = new R2StorageProvider({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
      endpoint: env.R2_ENDPOINT || undefined,
    });
  } else {
    console.log("📁 Using Local Mock Storage Provider for development");
    storageInstance = new MockStorageProvider(env.STORAGE_LOCAL_DIR, env.API_URL);
  }

  return storageInstance;
}

export const storage = getStorageProvider();
