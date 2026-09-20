import { trashRepository } from "../repositories/trash.repository";
import { userRepository } from "../repositories/user.repository";
import { storage } from "../config/storage";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";

export class TrashService {
  /**
   * List all files and folders currently in the trash
   */
  async listTrash(userId: string) {
    return trashRepository.listTrash(userId);
  }

  /**
   * Restore a single file from trash
   */
  async restoreFile(userId: string, fileId: string) {
    const file = await trashRepository.findDeletedFile(fileId, userId);
    if (!file) {
      throw ApiError.notFound("File not found in trash");
    }

    await trashRepository.restoreFile(fileId, userId);
    return { success: true, message: `File "${file.name}" restored successfully` };
  }

  /**
   * Restore a folder and its contents from trash
   */
  async restoreFolder(userId: string, folderId: string) {
    const folder = await trashRepository.findDeletedFolder(folderId, userId);
    if (!folder) {
      throw ApiError.notFound("Folder not found in trash");
    }

    const { restoredFolders } = await trashRepository.restoreFolder(folderId, userId);
    return {
      success: true,
      message: `Folder "${folder.name}" and ${restoredFolders} sub-item(s) restored successfully`,
    };
  }

  /**
   * Permanently delete a file from storage and database
   */
  async permanentlyDeleteFile(userId: string, fileId: string) {
    const file = await trashRepository.findDeletedFile(fileId, userId);
    if (!file) {
      throw ApiError.notFound("File not found in trash");
    }

    let totalBytesFreed = BigInt(file.size);

    // 1. Delete main file from storage
    try {
      await storage.delete(file.storageKey);
    } catch (err) {
      console.error(`Failed to delete object ${file.storageKey} from storage:`, err);
    }

    // 2. Delete all version objects from storage
    if (file.versions && file.versions.length > 0) {
      for (const ver of file.versions) {
        if (ver.storageKey !== file.storageKey) {
          try {
            await storage.delete(ver.storageKey);
            totalBytesFreed += BigInt(ver.size);
          } catch (err) {
            console.error(`Failed to delete version object ${ver.storageKey}:`, err);
          }
        }
      }
    }

    // 3. Remove from database & adjust user quota
    await prisma.$transaction([
      prisma.file.deleteMany({
        where: { id: fileId, ownerId: userId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            decrement: totalBytesFreed,
          },
        },
      }),
    ]);

    return {
      success: true,
      message: `File "${file.name}" permanently deleted`,
      bytesFreed: totalBytesFreed.toString(),
    };
  }

  /**
   * Permanently delete a folder and all contained files
   */
  async permanentlyDeleteFolder(userId: string, folderId: string) {
    const folder = await trashRepository.findDeletedFolder(folderId, userId);
    if (!folder) {
      throw ApiError.notFound("Folder not found in trash");
    }

    const { deletedFiles } = await trashRepository.permanentlyDeleteFolder(folderId, userId);

    let totalBytesFreed = BigInt(0);

    for (const f of deletedFiles) {
      totalBytesFreed += BigInt(f.size);
      try {
        await storage.delete(f.storageKey);
      } catch (err) {
        console.error(`Failed to delete storage key ${f.storageKey}:`, err);
      }

      if (f.versions) {
        for (const v of f.versions) {
          if (v.storageKey !== f.storageKey) {
            totalBytesFreed += BigInt(v.size);
            try {
              await storage.delete(v.storageKey);
            } catch (err) {
              console.error(`Failed to delete version key ${v.storageKey}:`, err);
            }
          }
        }
      }
    }

    if (totalBytesFreed > BigInt(0)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            decrement: totalBytesFreed,
          },
        },
      });
    }

    return {
      success: true,
      message: `Folder "${folder.name}" and ${deletedFiles.length} file(s) permanently deleted`,
      bytesFreed: totalBytesFreed.toString(),
    };
  }

  /**
   * Empty entire trash for a user
   */
  async emptyTrash(userId: string) {
    const deletedFiles = await trashRepository.getAllDeletedFiles(userId);

    let totalBytesFreed = BigInt(0);

    for (const f of deletedFiles) {
      totalBytesFreed += BigInt(f.size);
      try {
        await storage.delete(f.storageKey);
      } catch (err) {
        console.error(`Failed to delete storage key ${f.storageKey}:`, err);
      }

      if (f.versions) {
        for (const v of f.versions) {
          if (v.storageKey !== f.storageKey) {
            totalBytesFreed += BigInt(v.size);
            try {
              await storage.delete(v.storageKey);
            } catch (err) {
              console.error(`Failed to delete version key ${v.storageKey}:`, err);
            }
          }
        }
      }
    }

    const { filesCount, foldersCount } = await trashRepository.emptyTrashRecords(userId);

    if (totalBytesFreed > BigInt(0)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            decrement: totalBytesFreed,
          },
        },
      });
    }

    return {
      success: true,
      message: "Trash emptied successfully",
      filesPurged: filesCount,
      foldersPurged: foldersCount,
      bytesFreed: totalBytesFreed.toString(),
    };
  }
}

export const trashService = new TrashService();
