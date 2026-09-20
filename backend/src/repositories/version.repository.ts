import { prisma } from "../config/database";

export class VersionRepository {
  /**
   * Find all versions for a file ordered from newest to oldest
   */
  async listByFileId(fileId: string) {
    return prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { versionNumber: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Find a specific version by ID
   */
  async findById(versionId: string) {
    return prisma.fileVersion.findUnique({
      where: { id: versionId },
      include: {
        file: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Find the highest version number for a file
   */
  async getMaxVersionNumber(fileId: string): Promise<number> {
    const latest = await prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    return latest?.versionNumber || 0;
  }

  /**
   * Create a new file version record
   */
  async create(data: {
    fileId: string;
    versionNumber: number;
    storageKey: string;
    size: bigint;
    checksum?: string | null;
    createdById: string;
  }) {
    return prisma.fileVersion.create({
      data: {
        fileId: data.fileId,
        versionNumber: data.versionNumber,
        storageKey: data.storageKey,
        size: data.size,
        checksum: data.checksum || null,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Delete a version record
   */
  async delete(versionId: string) {
    return prisma.fileVersion.delete({
      where: { id: versionId },
    });
  }
}

export const versionRepository = new VersionRepository();
