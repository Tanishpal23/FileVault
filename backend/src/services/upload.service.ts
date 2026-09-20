import crypto from "crypto";
import { uploadRepository } from "../repositories/upload.repository";
import { fileRepository } from "../repositories/file.repository";
import { folderRepository } from "../repositories/folder.repository";
import { userRepository } from "../repositories/user.repository";
import { versionRepository } from "../repositories/version.repository";
import { storage } from "../config/storage";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { FileStatus, UploadStatus } from "@prisma/client";
import { fileProcessingQueue } from "../jobs/workers/fileProcessing.worker";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB standard multipart chunk size

export class UploadService {
  /**
   * Initiate a direct-to-storage multipart upload session
   */
  async initiateUpload(
    userId: string,
    data: {
      filename: string;
      mimeType: string;
      fileSize: number;
      folderId?: string | null;
    }
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    const fileSizeBigInt = BigInt(data.fileSize);
    if (user.storageUsed + fileSizeBigInt > user.storageQuota) {
      throw ApiError.badRequest("Storage quota exceeded. Upgrade storage or delete existing files.");
    }

    if (data.folderId) {
      const folder = await folderRepository.findById(data.folderId, userId);
      if (!folder) {
        throw ApiError.notFound("Target folder not found");
      }
    }

    const safeFilename = data.filename.replace(/[^\w.-]/g, "_");
    const fileId = crypto.randomUUID();
    const storageKey = `users/${userId}/files/${fileId}/${safeFilename}`;

    // Initiate multipart upload on storage provider (R2 or Mock)
    const r2UploadId = await storage.initiateMultipartUpload(storageKey, data.mimeType);

    // Calculate part count
    const totalParts = Math.max(1, Math.ceil(data.fileSize / CHUNK_SIZE));
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await uploadRepository.createSession({
      userId,
      filename: data.filename,
      mimeType: data.mimeType || "application/octet-stream",
      fileSize: fileSizeBigInt,
      chunkSize: CHUNK_SIZE,
      totalParts,
      storageKey,
      r2UploadId,
      expiresAt,
    });

    // Generate signed URLs for initial parts
    const partUrls: { partNumber: number; url: string }[] = [];
    const initialUrlCount = Math.min(totalParts, 10); // Provide up to 10 URLs upfront
    for (let i = 1; i <= initialUrlCount; i++) {
      const url = await storage.getSignedPartUrl(storageKey, r2UploadId, i, 3600);
      partUrls.push({ partNumber: i, url });
    }

    return {
      uploadSessionId: session.id,
      storageKey,
      r2UploadId,
      chunkSize: CHUNK_SIZE,
      totalParts,
      expiresAt: session.expiresAt,
      partUrls,
      folderId: data.folderId || null,
    };
  }

  /**
   * Get presigned URL for a specific chunk/part
   */
  async getPartUrl(userId: string, uploadSessionId: string, partNumber: number) {
    const session = await uploadRepository.findSessionById(uploadSessionId, userId);
    if (!session) {
      throw ApiError.notFound("Upload session not found");
    }

    if (session.status !== UploadStatus.INITIALIZED && session.status !== UploadStatus.UPLOADING) {
      throw ApiError.badRequest(`Cannot get part URL for session with status: ${session.status}`);
    }

    if (partNumber < 1 || partNumber > session.totalParts) {
      throw ApiError.badRequest(`Part number must be between 1 and ${session.totalParts}`);
    }

    const url = await storage.getSignedPartUrl(
      session.storageKey,
      session.r2UploadId,
      partNumber,
      3600
    );

    return {
      uploadSessionId,
      partNumber,
      url,
    };
  }

  /**
   * Record a completed part (ETag and size)
   */
  async recordPart(
    userId: string,
    uploadSessionId: string,
    data: { partNumber: number; etag: string; size: number }
  ) {
    const session = await uploadRepository.findSessionById(uploadSessionId, userId);
    if (!session) {
      throw ApiError.notFound("Upload session not found");
    }

    if (session.status === UploadStatus.COMPLETED || session.status === UploadStatus.ABORTED) {
      throw ApiError.badRequest(`Session is already ${session.status}`);
    }

    const part = await uploadRepository.upsertPart({
      uploadSessionId,
      partNumber: data.partNumber,
      etag: data.etag,
      size: data.size,
    });

    if (session.status === UploadStatus.INITIALIZED) {
      await uploadRepository.updateSessionStatus(uploadSessionId, UploadStatus.UPLOADING);
    }

    return part;
  }

  /**
   * Check upload status and retrieve completed parts for resumption
   */
  async getSessionStatus(userId: string, uploadSessionId: string) {
    const session = await uploadRepository.findSessionById(uploadSessionId, userId);
    if (!session) {
      throw ApiError.notFound("Upload session not found");
    }

    const uploadedBytes = session.parts.reduce((sum, p) => sum + p.size, 0);
    const progressPercent =
      Number(session.fileSize) > 0
        ? Math.min(100, Math.round((uploadedBytes / Number(session.fileSize)) * 100))
        : 0;

    return {
      id: session.id,
      filename: session.filename,
      fileSize: session.fileSize.toString(),
      totalParts: session.totalParts,
      chunkSize: session.chunkSize,
      status: session.status,
      uploadedParts: session.parts.map((p) => ({
        partNumber: p.partNumber,
        etag: p.etag,
        size: p.size,
      })),
      uploadedBytes,
      progressPercent,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Complete multipart upload, assemble object, create file record & update quota
   */
  async completeUpload(
    userId: string,
    uploadSessionId: string,
    data?: {
      folderId?: string | null;
      parts?: { partNumber: number; etag: string }[];
    }
  ) {
    const session = await uploadRepository.findSessionById(uploadSessionId, userId);
    if (!session) {
      throw ApiError.notFound("Upload session not found");
    }

    if (session.status === UploadStatus.COMPLETED) {
      if (session.fileId) {
        const existing = await fileRepository.findById(session.fileId, userId);
        if (existing) return existing;
      }
    }

    const existingParts = session.parts;
    const partsToAssemble =
      data?.parts && data.parts.length > 0
        ? data.parts
        : existingParts.map((p) => ({ partNumber: p.partNumber, etag: p.etag }));

    if (partsToAssemble.length < session.totalParts) {
      throw ApiError.badRequest(
        `Incomplete upload: expected ${session.totalParts} parts, but received ${partsToAssemble.length}`
      );
    }

    // Sort parts in ascending partNumber order
    const sortedParts = [...partsToAssemble].sort((a, b) => a.partNumber - b.partNumber);

    // Complete on Storage Provider
    const { etag } = await storage.completeMultipartUpload(
      session.storageKey,
      session.r2UploadId,
      sortedParts
    );

    // Check if a file with this name already exists in target folder -> Auto-version!
    const targetFolderId = data?.folderId || null;
    const existingFile = await fileRepository.findByNameAndFolder(session.filename, userId, targetFolderId);

    if (existingFile) {
      let currentMax = await versionRepository.getMaxVersionNumber(existingFile.id);
      if (currentMax === 0) {
        await versionRepository.create({
          fileId: existingFile.id,
          versionNumber: 1,
          storageKey: existingFile.storageKey,
          size: existingFile.size,
          checksum: existingFile.checksum,
          createdById: existingFile.ownerId,
        });
        currentMax = 1;
      }

      const nextVer = currentMax + 1;
      const newVersion = await versionRepository.create({
        fileId: existingFile.id,
        versionNumber: nextVer,
        storageKey: session.storageKey,
        size: session.fileSize,
        checksum: etag || null,
        createdById: userId,
      });

      const [updatedFile] = await prisma.$transaction([
        prisma.file.update({
          where: { id: existingFile.id },
          data: {
            storageKey: session.storageKey,
            size: session.fileSize,
            checksum: etag || null,
            mimeType: session.mimeType,
            currentVersionId: newVersion.id,
            updatedAt: new Date(),
          },
          include: {
            folder: { select: { id: true, name: true } },
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            storageUsed: { increment: session.fileSize },
          },
        }),
        prisma.uploadSession.update({
          where: { id: uploadSessionId },
          data: {
            status: UploadStatus.COMPLETED,
            fileId: existingFile.id,
          },
        }),
      ]);

      await prisma.activity.create({
        data: {
          actorId: userId,
          action: "FILE_VERSION_UPLOADED",
          resourceId: existingFile.id,
          resourceType: "FILE",
          resourceName: existingFile.name,
          metadata: {
            versionNumber: nextVer,
            size: session.fileSize.toString(),
          },
        },
      });

      return {
        ...updatedFile,
        size: updatedFile.size.toString(),
        versionNumber: nextVer,
      };
    }

    // Otherwise create brand new file record
    const [file] = await prisma.$transaction([
      prisma.file.create({
        data: {
          ownerId: userId,
          folderId: targetFolderId,
          name: session.filename,
          originalName: session.filename,
          mimeType: session.mimeType,
          size: session.fileSize,
          storageKey: session.storageKey,
          checksum: etag || null,
          status: FileStatus.AVAILABLE,
        },
        include: {
          folder: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            increment: session.fileSize,
          },
        },
      }),
      prisma.uploadSession.update({
        where: { id: uploadSessionId },
        data: {
          status: UploadStatus.COMPLETED,
          fileId: undefined, // updated below
        },
      }),
    ]);

    await prisma.uploadSession.update({
      where: { id: uploadSessionId },
      data: { fileId: file.id },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        actorId: userId,
        action: "FILE_UPLOADED",
        resourceId: file.id,
        resourceType: "FILE",
        resourceName: file.name,
        metadata: {
          size: file.size.toString(),
          mimeType: file.mimeType,
        },
      },
    });

    // Enqueue background security scan
    fileProcessingQueue.add("scanFile", { fileId: file.id }).catch(() => {});

    return {
      ...file,
      size: file.size.toString(),
    };
  }

  /**
   * Abort multipart upload and free storage
   */
  async abortUpload(userId: string, uploadSessionId: string) {
    const session = await uploadRepository.findSessionById(uploadSessionId, userId);
    if (!session) {
      throw ApiError.notFound("Upload session not found");
    }

    await storage.abortMultipartUpload(session.storageKey, session.r2UploadId);
    await uploadRepository.updateSessionStatus(uploadSessionId, UploadStatus.ABORTED);

    return { success: true, message: "Upload session aborted" };
  }

  /**
   * Direct upload endpoint (convenient for single files / small files / drag & drop)
   */
  async directUpload(
    userId: string,
    file: Express.Multer.File,
    folderId?: string | null
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    const fileSizeBigInt = BigInt(file.size);
    if (user.storageUsed + fileSizeBigInt > user.storageQuota) {
      throw ApiError.badRequest("Storage quota exceeded. Upgrade storage or delete existing files.");
    }

    if (folderId) {
      const folder = await folderRepository.findById(folderId, userId);
      if (!folder) {
        throw ApiError.notFound("Target folder not found");
      }
    }

    const targetFolderId = folderId || null;
    const existingFile = await fileRepository.findByNameAndFolder(file.originalname, userId, targetFolderId);

    if (existingFile) {
      let currentMax = await versionRepository.getMaxVersionNumber(existingFile.id);
      if (currentMax === 0) {
        await versionRepository.create({
          fileId: existingFile.id,
          versionNumber: 1,
          storageKey: existingFile.storageKey,
          size: existingFile.size,
          checksum: existingFile.checksum,
          createdById: existingFile.ownerId,
        });
        currentMax = 1;
      }

      const nextVer = currentMax + 1;
      const safeFilename = file.originalname.replace(/[^\w.-]/g, "_");
      const newStorageKey = `users/${userId}/files/${existingFile.id}/v${nextVer}/${safeFilename}`;

      await storage.upload(newStorageKey, file.buffer, file.mimetype);

      const newVersion = await versionRepository.create({
        fileId: existingFile.id,
        versionNumber: nextVer,
        storageKey: newStorageKey,
        size: fileSizeBigInt,
        createdById: userId,
      });

      const [updatedFile] = await prisma.$transaction([
        prisma.file.update({
          where: { id: existingFile.id },
          data: {
            storageKey: newStorageKey,
            size: fileSizeBigInt,
            mimeType: file.mimetype || "application/octet-stream",
            currentVersionId: newVersion.id,
            updatedAt: new Date(),
          },
          include: {
            folder: { select: { id: true, name: true } },
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            storageUsed: { increment: fileSizeBigInt },
          },
        }),
      ]);

      await prisma.activity.create({
        data: {
          actorId: userId,
          action: "FILE_VERSION_UPLOADED",
          resourceId: existingFile.id,
          resourceType: "FILE",
          resourceName: existingFile.name,
          metadata: {
            versionNumber: nextVer,
            size: fileSizeBigInt.toString(),
          },
        },
      });

      return {
        ...updatedFile,
        size: updatedFile.size.toString(),
        versionNumber: nextVer,
      };
    }

    const safeFilename = file.originalname.replace(/[^\w.-]/g, "_");
    const fileId = crypto.randomUUID();
    const storageKey = `users/${userId}/files/${fileId}/${safeFilename}`;

    // Upload to storage provider
    await storage.upload(storageKey, file.buffer, file.mimetype);

    // Create file record & update quota
    const [newFile] = await prisma.$transaction([
      prisma.file.create({
        data: {
          ownerId: userId,
          folderId: targetFolderId,
          name: file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype || "application/octet-stream",
          size: fileSizeBigInt,
          storageKey,
          status: FileStatus.AVAILABLE,
        },
        include: {
          folder: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            increment: fileSizeBigInt,
          },
        },
      }),
    ]);

    // Record activity
    await prisma.activity.create({
      data: {
        actorId: userId,
        action: "FILE_UPLOADED",
        resourceId: newFile.id,
        resourceType: "FILE",
        resourceName: newFile.name,
        metadata: {
          size: newFile.size.toString(),
          mimeType: newFile.mimeType,
        },
      },
    });

    return {
      ...newFile,
      size: newFile.size.toString(),
    };
  }
}

export const uploadService = new UploadService();
