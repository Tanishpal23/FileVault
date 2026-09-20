import { prisma } from "../config/database";
import { FileStatus } from "@prisma/client";

export class FileRepository {
  async findById(id: string, ownerId?: string) {
    return prisma.file.findFirst({
      where: {
        id,
        ...(ownerId && { ownerId }),
        deletedAt: null,
      },
      include: {
        folder: {
          select: { id: true, name: true },
        },
        currentVersion: true,
        starredBy: ownerId
          ? {
              where: { userId: ownerId },
            }
          : undefined,
      },
    });
  }

  async findByIdForUser(id: string, userId: string) {
    return prisma.file.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        folder: {
          select: { id: true, name: true },
        },
        currentVersion: true,
        starredBy: {
          where: { userId },
        },
      },
    });
  }

  async findByNameAndFolder(name: string, ownerId: string, folderId?: string | null) {
    return prisma.file.findFirst({
      where: {
        name: name.trim(),
        ownerId,
        folderId: folderId || null,
        deletedAt: null,
      },
    });
  }

  async listFiles(
    ownerId: string,
    options: {
      folderId?: string | null;
      search?: string;
      status?: FileStatus;
      sortBy?: "name" | "createdAt" | "size" | "updatedAt";
      sortOrder?: "asc" | "desc";
      limit?: number;
      offset?: number;
    }
  ) {
    const {
      folderId,
      search,
      status = FileStatus.AVAILABLE,
      sortBy = "updatedAt",
      sortOrder = "desc",
      limit = 50,
      offset = 0,
    } = options;

    const where: any = {
      ownerId,
      deletedAt: null,
      status,
      ...(folderId !== undefined && { folderId: folderId || null }),
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive",
        },
      }),
    };

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
        include: {
          folder: {
            select: { id: true, name: true },
          },
          starredBy: {
            where: { userId: ownerId },
          },
          _count: {
            select: {
              versions: true,
              permissions: true,
              shareLinks: true,
            },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files: files.map((f) => ({
        ...f,
        size: f.size.toString(),
        isStarred: (f.starredBy?.length || 0) > 0,
      })),
      total,
      limit,
      offset,
    };
  }

  async create(data: {
    ownerId: string;
    folderId?: string | null;
    name: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    storageKey: string;
    checksum?: string | null;
    status?: FileStatus;
  }) {
    return prisma.file.create({
      data: {
        ownerId: data.ownerId,
        folderId: data.folderId || null,
        name: data.name.trim(),
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        storageKey: data.storageKey,
        checksum: data.checksum || null,
        status: data.status || FileStatus.UPLOADING,
      },
    });
  }

  async update(
    id: string,
    ownerId: string,
    data: {
      name?: string;
      folderId?: string | null;
      status?: FileStatus;
      currentVersionId?: string | null;
    }
  ) {
    return prisma.file.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.folderId !== undefined && { folderId: data.folderId }),
        ...(data.status && { status: data.status }),
        ...(data.currentVersionId !== undefined && { currentVersionId: data.currentVersionId }),
      },
    });
  }

  async softDelete(id: string, ownerId: string) {
    return prisma.file.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateById(
    id: string,
    data: {
      name?: string;
      folderId?: string | null;
      status?: FileStatus;
      currentVersionId?: string | null;
    }
  ) {
    return prisma.file.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.folderId !== undefined && { folderId: data.folderId }),
        ...(data.status && { status: data.status }),
        ...(data.currentVersionId !== undefined && { currentVersionId: data.currentVersionId }),
      },
    });
  }

  async softDeleteById(id: string) {
    return prisma.file.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async toggleStar(fileId: string, userId: string) {
    const existing = await prisma.starredFile.findUnique({
      where: {
        userId_fileId: { userId, fileId },
      },
    });

    if (existing) {
      await prisma.starredFile.delete({
        where: {
          userId_fileId: { userId, fileId },
        },
      });
      return false;
    } else {
      await prisma.starredFile.create({
        data: { userId, fileId },
      });
      return true;
    }
  }
}

export const fileRepository = new FileRepository();
