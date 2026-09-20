import { prisma } from "../config/database";
import { UploadStatus } from "@prisma/client";

export class UploadRepository {
  async createSession(data: {
    userId: string;
    filename: string;
    mimeType: string;
    fileSize: bigint;
    chunkSize: number;
    totalParts: number;
    storageKey: string;
    r2UploadId: string;
    expiresAt: Date;
    fileId?: string | null;
  }) {
    return prisma.uploadSession.create({
      data: {
        userId: data.userId,
        filename: data.filename,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        chunkSize: data.chunkSize,
        totalParts: data.totalParts,
        storageKey: data.storageKey,
        r2UploadId: data.r2UploadId,
        expiresAt: data.expiresAt,
        status: UploadStatus.INITIALIZED,
        fileId: data.fileId || null,
      },
    });
  }

  async findSessionById(id: string, userId?: string) {
    return prisma.uploadSession.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
      include: {
        parts: {
          orderBy: { partNumber: "asc" },
        },
        user: {
          select: {
            id: true,
            storageQuota: true,
            storageUsed: true,
          },
        },
      },
    });
  }

  async updateSessionStatus(id: string, status: UploadStatus, fileId?: string | null) {
    return prisma.uploadSession.update({
      where: { id },
      data: {
        status,
        ...(fileId !== undefined && { fileId }),
        updatedAt: new Date(),
      },
    });
  }

  async upsertPart(data: {
    uploadSessionId: string;
    partNumber: number;
    etag: string;
    size: number;
  }) {
    return prisma.uploadPart.upsert({
      where: {
        uploadSessionId_partNumber: {
          uploadSessionId: data.uploadSessionId,
          partNumber: data.partNumber,
        },
      },
      create: {
        uploadSessionId: data.uploadSessionId,
        partNumber: data.partNumber,
        etag: data.etag,
        size: data.size,
      },
      update: {
        etag: data.etag,
        size: data.size,
        uploadedAt: new Date(),
      },
    });
  }

  async listParts(uploadSessionId: string) {
    return prisma.uploadPart.findMany({
      where: { uploadSessionId },
      orderBy: { partNumber: "asc" },
    });
  }

  async deleteSession(id: string) {
    return prisma.uploadSession.delete({
      where: { id },
    });
  }
}

export const uploadRepository = new UploadRepository();
