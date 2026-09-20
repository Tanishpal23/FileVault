import { prisma } from "../config/database";

export class TrashRepository {
  /**
   * List all soft-deleted files and folders for a user
   */
  async listTrash(ownerId: string) {
    const [files, folders] = await Promise.all([
      prisma.file.findMany({
        where: {
          ownerId,
          deletedAt: { not: null },
        },
        orderBy: { deletedAt: "desc" },
        include: {
          folder: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.folder.findMany({
        where: {
          ownerId,
          deletedAt: { not: null },
        },
        orderBy: { deletedAt: "desc" },
        include: {
          parent: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              files: true,
              subFolders: true,
            },
          },
        },
      }),
    ]);

    return {
      files: files.map((f) => ({
        ...f,
        size: f.size.toString(),
      })),
      folders,
    };
  }

  /**
   * Find a soft-deleted file by ID
   */
  async findDeletedFile(id: string, ownerId: string) {
    return prisma.file.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: { not: null },
      },
      include: {
        versions: true,
      },
    });
  }

  /**
   * Restore a soft-deleted file
   */
  async restoreFile(id: string, ownerId: string) {
    return prisma.file.updateMany({
      where: {
        id,
        ownerId,
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * Permanently delete a file from database
   */
  async permanentlyDeleteFile(id: string, ownerId: string) {
    return prisma.file.deleteMany({
      where: {
        id,
        ownerId,
        deletedAt: { not: null },
      },
    });
  }

  /**
   * Find a soft-deleted folder by ID
   */
  async findDeletedFolder(id: string, ownerId: string) {
    return prisma.folder.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: { not: null },
      },
    });
  }

  /**
   * Restore a folder and its contents
   */
  async restoreFolder(id: string, ownerId: string) {
    // Collect all descendant folder IDs that were deleted
    const allFolderIds: string[] = [id];
    const queue: string[] = [id];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = await prisma.folder.findMany({
        where: { parentId, ownerId },
        select: { id: true },
      });

      for (const child of children) {
        allFolderIds.push(child.id);
        queue.push(child.id);
      }
    }

    await prisma.folder.updateMany({
      where: { id: { in: allFolderIds }, ownerId },
      data: { deletedAt: null },
    });

    await prisma.file.updateMany({
      where: { folderId: { in: allFolderIds }, ownerId },
      data: { deletedAt: null },
    });

    return { restoredFolders: allFolderIds.length };
  }

  /**
   * Permanently delete a folder and all descendants from database
   */
  async permanentlyDeleteFolder(id: string, ownerId: string) {
    const allFolderIds: string[] = [id];
    const queue: string[] = [id];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = await prisma.folder.findMany({
        where: { parentId, ownerId },
        select: { id: true },
      });

      for (const child of children) {
        allFolderIds.push(child.id);
        queue.push(child.id);
      }
    }

    // Find all files in these folders to know storage keys and sizes
    const filesInFolders = await prisma.file.findMany({
      where: { folderId: { in: allFolderIds }, ownerId },
      include: { versions: true },
    });

    // Delete files in DB
    await prisma.file.deleteMany({
      where: { folderId: { in: allFolderIds }, ownerId },
    });

    // Delete folders in DB
    await prisma.folder.deleteMany({
      where: { id: { in: allFolderIds }, ownerId },
    });

    return {
      deletedFolderIds: allFolderIds,
      deletedFiles: filesInFolders,
    };
  }

  /**
   * List all soft-deleted files for emptying trash
   */
  async getAllDeletedFiles(ownerId: string) {
    return prisma.file.findMany({
      where: {
        ownerId,
        deletedAt: { not: null },
      },
      include: {
        versions: true,
      },
    });
  }

  /**
   * Empty trash: delete all soft-deleted files and folders
   */
  async emptyTrashRecords(ownerId: string) {
    const [deletedFiles, deletedFolders] = await Promise.all([
      prisma.file.deleteMany({
        where: {
          ownerId,
          deletedAt: { not: null },
        },
      }),
      prisma.folder.deleteMany({
        where: {
          ownerId,
          deletedAt: { not: null },
        },
      }),
    ]);

    return {
      filesCount: deletedFiles.count,
      foldersCount: deletedFolders.count,
    };
  }
}

export const trashRepository = new TrashRepository();
