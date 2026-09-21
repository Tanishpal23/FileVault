import { fileRepository } from "../repositories/file.repository";
import { folderRepository } from "../repositories/folder.repository";
import { permissionsService } from "./permissions.service";
import { storage } from "../config/storage";
import { ApiError } from "../utils/ApiError";

export class FileService {
  async listFiles(
    userId: string,
    options: {
      folderId?: string | null;
      search?: string;
      sortBy?: "name" | "createdAt" | "size" | "updatedAt";
      sortOrder?: "asc" | "desc";
      limit?: number;
      offset?: number;
    }
  ) {
    const targetFolderId =
      options.folderId && options.folderId !== "root" ? options.folderId : null;

    if (targetFolderId) {
      const folder = await folderRepository.findById(targetFolderId, userId);
      if (!folder) {
        throw ApiError.notFound("Folder not found");
      }
    }

    return fileRepository.listFiles(userId, {
      ...options,
      folderId: targetFolderId,
    });
  }

  async getFile(userId: string, fileId: string) {
    const canView = await permissionsService.canView(userId, fileId);
    if (!canView) {
      throw ApiError.notFound("File not found");
    }

    const file = await fileRepository.findByIdForUser(fileId, userId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const starredList = (file as any).starredBy || [];
    return {
      ...file,
      size: file.size.toString(),
      isStarred: starredList.length > 0,
    };
  }

  async renameFile(userId: string, fileId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) {
      throw ApiError.badRequest("File name cannot be empty");
    }

    const canEdit = await permissionsService.canEdit(userId, fileId);
    if (!canEdit) {
      throw ApiError.forbidden("You do not have permission to edit this file");
    }

    const file = await fileRepository.findByIdForUser(fileId, userId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const conflict = await fileRepository.findByNameAndFolder(trimmed, file.ownerId, file.folderId);
    if (conflict && conflict.id !== fileId) {
      throw ApiError.conflict("A file with this name already exists in this folder");
    }

    await fileRepository.updateById(fileId, { name: trimmed });
    return this.getFile(userId, fileId);
  }

  async moveFile(userId: string, fileId: string, newFolderId?: string | null) {
    const canEdit = await permissionsService.canEdit(userId, fileId);
    if (!canEdit) {
      throw ApiError.forbidden("You do not have permission to move this file");
    }

    const file = await fileRepository.findByIdForUser(fileId, userId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const targetFolderId = newFolderId && newFolderId !== "root" ? newFolderId : null;

    if (targetFolderId) {
      const folder = await folderRepository.findById(targetFolderId, userId);
      if (!folder) {
        throw ApiError.notFound("Target folder not found");
      }
    }

    const conflict = await fileRepository.findByNameAndFolder(file.name, file.ownerId, targetFolderId);
    if (conflict && conflict.id !== fileId) {
      throw ApiError.conflict("A file with this name already exists in target folder");
    }

    await fileRepository.updateById(fileId, { folderId: targetFolderId });
    return this.getFile(userId, fileId);
  }

  async deleteFile(userId: string, fileId: string) {
    const canDelete = await permissionsService.canDelete(userId, fileId);
    if (!canDelete) {
      throw ApiError.forbidden("Only the file owner can delete this file");
    }

    const file = await fileRepository.findById(fileId, userId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    await fileRepository.softDeleteById(fileId);
    return { message: "File moved to trash" };
  }

  async toggleStar(userId: string, fileId: string) {
    const canView = await permissionsService.canView(userId, fileId);
    if (!canView) {
      throw ApiError.notFound("File not found");
    }

    const isStarred = await fileRepository.toggleStar(fileId, userId);
    return { fileId, isStarred };
  }

  async getDownloadUrl(
    userId: string,
    fileId: string,
    disposition: "inline" | "attachment" = "attachment"
  ) {
    const canDownload = await permissionsService.canDownload(userId, fileId);
    if (!canDownload) {
      throw ApiError.notFound("File not found");
    }

    const file = await fileRepository.findByIdForUser(fileId, userId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const downloadUrl = await storage.getSignedDownloadUrl(
      file.storageKey,
      3600, // 1 hour
      file.name,
      disposition
    );

    return {
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size.toString(),
      },
      downloadUrl,
      expiresInSeconds: 3600,
    };
  }
}

export const fileService = new FileService();
