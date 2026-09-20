import { prisma } from "../config/database";
import { FileStatus } from "@prisma/client";

export interface SearchOptions {
  q?: string;
  type?: string;
  folderId?: string | null;
  minSize?: number;
  maxSize?: number;
  startDate?: Date;
  endDate?: Date;
  isStarred?: boolean;
  limit?: number;
  offset?: number;
}

export class SearchRepository {
  /**
   * Search files matching keyword and filters
   */
  async searchFiles(userId: string, options: SearchOptions) {
    const {
      q,
      type,
      folderId,
      minSize,
      maxSize,
      startDate,
      endDate,
      isStarred,
      limit = 30,
      offset = 0,
    } = options;

    const where: any = {
      ownerId: userId,
      deletedAt: null,
      status: FileStatus.AVAILABLE,
    };

    if (q && q.trim()) {
      where.name = {
        contains: q.trim(),
        mode: "insensitive",
      };
    }

    if (folderId !== undefined) {
      where.folderId = folderId || null;
    }

    if (minSize !== undefined || maxSize !== undefined) {
      where.size = {};
      if (minSize !== undefined) where.size.gte = BigInt(minSize);
      if (maxSize !== undefined) where.size.lte = BigInt(maxSize);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (isStarred) {
      where.starredBy = {
        some: { userId },
      };
    }

    // MIME type classification
    if (type && type !== "all") {
      switch (type.toLowerCase()) {
        case "image":
          where.mimeType = { startsWith: "image/" };
          break;
        case "video":
          where.mimeType = { startsWith: "video/" };
          break;
        case "audio":
          where.mimeType = { startsWith: "audio/" };
          break;
        case "document":
        case "pdf":
          where.OR = [
            { mimeType: { contains: "pdf" } },
            { mimeType: { contains: "document" } },
            { mimeType: { contains: "text" } },
            { mimeType: { contains: "word" } },
          ];
          break;
        case "spreadsheet":
          where.OR = [
            { mimeType: { contains: "sheet" } },
            { mimeType: { contains: "csv" } },
            { mimeType: { contains: "excel" } },
          ];
          break;
        case "archive":
          where.OR = [
            { mimeType: { contains: "zip" } },
            { mimeType: { contains: "tar" } },
            { mimeType: { contains: "rar" } },
            { mimeType: { contains: "7z" } },
            { mimeType: { contains: "compressed" } },
          ];
          break;
        default:
          where.mimeType = { contains: type };
      }
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          folder: {
            select: { id: true, name: true },
          },
          starredBy: {
            where: { userId },
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

  /**
   * Search folders matching query
   */
  async searchFolders(userId: string, q?: string) {
    if (!q || !q.trim()) return [];

    return prisma.folder.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        name: {
          contains: q.trim(),
          mode: "insensitive",
        },
      },
      take: 10,
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { files: true, subFolders: true },
        },
      },
    });
  }

  /**
   * Get recently modified or uploaded files
   */
  async getRecentFiles(userId: string, limit = 30) {
    const files = await prisma.file.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        status: FileStatus.AVAILABLE,
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        folder: {
          select: { id: true, name: true },
        },
        starredBy: {
          where: { userId },
        },
      },
    });

    return files.map((f) => ({
      ...f,
      size: f.size.toString(),
      isStarred: (f.starredBy?.length || 0) > 0,
    }));
  }

  /**
   * Get all starred files for a user
   */
  async getStarredFiles(userId: string) {
    const starredRecords = await prisma.starredFile.findMany({
      where: {
        userId,
        file: {
          deletedAt: null,
          status: FileStatus.AVAILABLE,
        },
      },
      orderBy: { starredAt: "desc" },
      include: {
        file: {
          include: {
            folder: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return starredRecords.map((sr) => ({
      ...sr.file,
      size: sr.file.size.toString(),
      isStarred: true,
      starredAt: sr.starredAt,
    }));
  }
}

export const searchRepository = new SearchRepository();
