import { Router, Request, Response } from "express";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const baseDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR);

/**
 * Mock Direct Upload endpoint (acts like S3 PutObject signed URL)
 */
router.put(
  "/mock-upload",
  asyncHandler(async (req: Request, res: Response) => {
    const key = req.query.key as string;
    if (!key) {
      res.status(400).json({ success: false, message: "Missing key" });
      return;
    }

    const safeKey = key.replace(/\.\./g, "");
    const filePath = path.join(baseDir, safeKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(filePath, buffer);
      res.status(200).setHeader("ETag", `"${buffer.length}"`).send();
    });
  })
);

/**
 * Mock Direct Multipart Chunk Upload endpoint (acts like S3 UploadPart signed URL)
 */
router.put(
  "/mock-part-upload",
  asyncHandler(async (req: Request, res: Response) => {
    const uploadId = req.query.uploadId as string;
    const partNumber = req.query.partNumber as string;

    if (!uploadId || !partNumber) {
      res.status(400).json({ success: false, message: "Missing uploadId or partNumber" });
      return;
    }

    const partFile = path.join(baseDir, ".multipart", uploadId, `part_${partNumber}`);
    await fs.mkdir(path.dirname(partFile), { recursive: true });

    const writeStream = fsSync.createWriteStream(partFile);
    req.pipe(writeStream);

    writeStream.on("finish", () => {
      res.status(200).setHeader("ETag", `"etag-part-${partNumber}"`).send();
    });
    writeStream.on("error", (err) => {
      res.status(500).json({ success: false, error: err.message });
    });
  })
);

const getMimeType = (filename?: string): string => {
  if (!filename) return "application/octet-stream";
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".zip": "application/zip",
  };
  return mimeMap[ext] || "application/octet-stream";
};

/**
 * Mock Direct Download endpoint (acts like S3 GetObject signed URL)
 */
router.get(
  "/mock-download",
  asyncHandler(async (req: Request, res: Response) => {
    const key = req.query.key as string;
    const filename = req.query.filename as string;
    const disposition = (req.query.disposition as string) || "inline";

    if (!key) {
      res.status(400).json({ success: false, message: "Missing key" });
      return;
    }

    const safeKey = key.replace(/\.\./g, "");
    const filePath = path.join(baseDir, safeKey);

    if (!fsSync.existsSync(filePath)) {
      res.status(404).json({ success: false, message: "File not found" });
      return;
    }

    if (filename) {
      const mimeType = getMimeType(filename);
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${encodeURIComponent(filename)}"`
      );
    }

    res.sendFile(filePath);
  })
);

export default router;
