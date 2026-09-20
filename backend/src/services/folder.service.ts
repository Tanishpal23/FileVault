import { folderRepository } from "../repositories/folder.repository";
import { fileRepository } from "../repositories/file.repository";
import { ApiError } from "../utils/ApiError";

export class FolderService {
  async createFolder(userId: string, data: { name: string; parentId?: string | null; color?: string }) {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw ApiError.badRequest("Folder name cannot be empty");
    }

    if (data.parentId) {
      const parent = await folderRepository.findById(data.parentId, userId);
      if (!parent) {
        throw ApiError.notFound("Parent folder not found");
      }
    }

    const existing = await folderRepository.findByNameAndParent(trimmedName, userId, data.parentId);
    if (existing) {
      throw ApiError.conflict("A folder with this name already exists in this directory");
    }

    return folderRepository.create({
      ownerId: userId,
      parentId: data.parentId || null,
      name: trimmedName,
      color: data.color || null,
    });
  }

  async getFolder(userId: string, folderId: string) {
    const folder = await folderRepository.findById(folderId, userId);
    if (!folder) {
      throw ApiError.notFound("Folder not found");
    }

    const breadcrumbs = await folderRepository.getBreadcrumbs(folderId, userId);

    return {
      ...folder,
      breadcrumbs,
    };
  }

  async getFolderContents(
    userId: string,
    folderId?: string | null,
    options: { search?: string; sortBy?: any; sortOrder?: any } = {}
  ) {
    const targetFolderId = folderId && folderId !== "root" ? folderId : null;

    let currentFolder = null;
    let breadcrumbs = [{ id: "root", name: "My Files" }];

    if (targetFolderId) {
      currentFolder = await folderRepository.findById(targetFolderId, userId);
      if (!currentFolder) {
        throw ApiError.notFound("Folder not found");
      }
      const trail = await folderRepository.getBreadcrumbs(targetFolderId, userId);
      breadcrumbs = [{ id: "root", name: "My Files" }, ...trail];
    }

    const [folders, filesResult] = await Promise.all([
      folderRepository.listSubFolders(userId, targetFolderId),
      fileRepository.listFiles(userId, {
        folderId: targetFolderId,
        search: options.search,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      }),
    ]);

    return {
      currentFolder,
      breadcrumbs,
      folders,
      files: filesResult.files,
      totalFiles: filesResult.total,
    };
  }

  async renameFolder(userId: string, folderId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) {
      throw ApiError.badRequest("Folder name cannot be empty");
    }

    const folder = await folderRepository.findById(folderId, userId);
    if (!folder) {
      throw ApiError.notFound("Folder not found");
    }

    const conflict = await folderRepository.findByNameAndParent(trimmed, userId, folder.parentId);
    if (conflict && conflict.id !== folderId) {
      throw ApiError.conflict("A folder with this name already exists in this directory");
    }

    await folderRepository.update(folderId, userId, { name: trimmed });
    return this.getFolder(userId, folderId);
  }

  async moveFolder(userId: string, folderId: string, newParentId?: string | null) {
    const folder = await folderRepository.findById(folderId, userId);
    if (!folder) {
      throw ApiError.notFound("Folder not found");
    }

    const targetParentId = newParentId && newParentId !== "root" ? newParentId : null;

    if (targetParentId === folderId) {
      throw ApiError.badRequest("Cannot move folder into itself");
    }

    if (targetParentId) {
      const parent = await folderRepository.findById(targetParentId, userId);
      if (!parent) {
        throw ApiError.notFound("Target folder not found");
      }

      // Check if targetParentId is a descendant of folderId (cycle detection)
      let checkId: string | null = targetParentId;
      while (checkId) {
        if (checkId === folderId) {
          throw ApiError.badRequest("Cannot move folder into one of its subfolders");
        }
        const ancestor = await folderRepository.findById(checkId, userId);
        checkId = ancestor?.parentId || null;
      }
    }

    await folderRepository.update(folderId, userId, { parentId: targetParentId });
    return this.getFolder(userId, folderId);
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await folderRepository.findById(folderId, userId);
    if (!folder) {
      throw ApiError.notFound("Folder not found");
    }

    return folderRepository.softDelete(folderId, userId);
  }
}

export const folderService = new FolderService();
