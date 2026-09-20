import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";
import { StorageProvider } from "./StorageProvider";
import { ObjectMetadata, CompletedPart } from "../types/storage";

export class MockStorageProvider implements StorageProvider {
  private baseDir: string;
  private apiUrl: string;

  constructor(baseDir = "./storage_data", apiUrl = "http://localhost:5000") {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    this.apiUrl = apiUrl;

    if (!fsSync.existsSync(this.baseDir)) {
      fsSync.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/\.\./g, "");
    return path.join(this.baseDir, safeKey);
  }

  private getMultipartDir(uploadId: string): string {
    return path.join(this.baseDir, ".multipart", uploadId);
  }

  async upload(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType = "application/octet-stream"
  ): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);

    const metaPath = `${filePath}.meta.json`;
    await fs.writeFile(
      metaPath,
      JSON.stringify({
        contentType,
        uploadedAt: new Date().toISOString(),
      })
    );
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
      await fs.unlink(`${filePath}.meta.json`).catch(() => {});
    } catch {
      // Ignored if file does not exist
    }
  }

  async copyObject(sourceKey: string, targetKey: string): Promise<void> {
    const src = this.getFilePath(sourceKey);
    const dest = this.getFilePath(targetKey);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    try {
      await fs.copyFile(`${src}.meta.json`, `${dest}.meta.json`);
    } catch {
      // Ignore missing metadata
    }
  }

  async getSignedUploadUrl(
    key: string,
    _expiresInSeconds = 900,
    contentType = "application/octet-stream"
  ): Promise<string> {
    const encodedKey = encodeURIComponent(key);
    const token = crypto.randomBytes(16).toString("hex");
    return `${this.apiUrl}/api/storage/mock-upload?key=${encodedKey}&token=${token}&contentType=${encodeURIComponent(
      contentType
    )}`;
  }

  async getSignedDownloadUrl(
    key: string,
    _expiresInSeconds = 900,
    filename?: string,
    disposition: "inline" | "attachment" = "inline"
  ): Promise<string> {
    const encodedKey = encodeURIComponent(key);
    const fnParam = filename ? `&filename=${encodeURIComponent(filename)}` : "";
    const dispParam = `&disposition=${disposition}`;
    return `${this.apiUrl}/api/storage/mock-download?key=${encodedKey}${fnParam}${dispParam}`;
  }

  async initiateMultipartUpload(_key: string, _contentType?: string): Promise<string> {
    const uploadId = crypto.randomBytes(16).toString("hex");
    const multipartDir = this.getMultipartDir(uploadId);
    await fs.mkdir(multipartDir, { recursive: true });
    return uploadId;
  }

  async getSignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    _expiresInSeconds = 900
  ): Promise<string> {
    const encodedKey = encodeURIComponent(key);
    return `${this.apiUrl}/api/storage/mock-part-upload?key=${encodedKey}&uploadId=${uploadId}&partNumber=${partNumber}`;
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPart[]
  ): Promise<{ location?: string; etag?: string }> {
    const targetFile = this.getFilePath(key);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });

    const multipartDir = this.getMultipartDir(uploadId);
    const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);

    const writeStream = fsSync.createWriteStream(targetFile);

    for (const part of sortedParts) {
      const partFile = path.join(multipartDir, `part_${part.partNumber}`);
      if (fsSync.existsSync(partFile)) {
        const data = await fs.readFile(partFile);
        writeStream.write(data);
      }
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.end((err?: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Cleanup multipart temp folder
    await fs.rm(multipartDir, { recursive: true, force: true }).catch(() => {});

    return {
      location: `${this.apiUrl}/storage/${key}`,
      etag: `"${crypto.randomBytes(16).toString("hex")}"`,
    };
  }

  async abortMultipartUpload(_key: string, uploadId: string): Promise<void> {
    const multipartDir = this.getMultipartDir(uploadId);
    await fs.rm(multipartDir, { recursive: true, force: true }).catch(() => {});
  }

  async getObjectMetadata(key: string): Promise<ObjectMetadata> {
    const filePath = this.getFilePath(key);
    const stat = await fs.stat(filePath);
    let contentType = "application/octet-stream";

    try {
      const meta = JSON.parse(await fs.readFile(`${filePath}.meta.json`, "utf8"));
      if (meta.contentType) contentType = meta.contentType;
    } catch {
      // Default
    }

    return {
      contentLength: stat.size,
      lastModified: stat.mtime,
      contentType,
    };
  }

  async objectExists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getObject(key: string): Promise<any> {
    const filePath = this.getFilePath(key);
    return fsSync.createReadStream(filePath);
  }
}
