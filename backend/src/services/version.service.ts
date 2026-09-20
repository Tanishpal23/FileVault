import { versionRepository } from "../repositories/version.repository";
import { fileRepository } from "../repositories/file.repository";
import { permissionsService } from "./permissions.service";
import { storage } from "../config/storage";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import crypto from "crypto";

export class VersionService {
  /**
   * List all versions of a file
   */
  async listVersions(userId: string, fileId: string) {
    const canView = await permissionsService.canView(userId, fileId);
    if (!canView) {
      throw ApiError.forbidden("You do not have permission to view this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const versions = await versionRepository.listByFileId(fileId);

    // If file has no Version records yet, it represents v1
    let formattedVersions = versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      size: v.size.toString(),
      checksum: v.checksum,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
      isCurrent: v.id === file.currentVersionId || v.storageKey === file.storageKey,
    }));

    // If there are no versions stored yet, return file as initial v1
    if (formattedVersions.length === 0) {
      formattedVersions = [
        {
          id: "initial-v1",
          versionNumber: 1,
          size: file.size.toString(),
          checksum: file.checksum,
          createdAt: file.createdAt,
          createdBy: {
            id: file.ownerId,
            name: "Owner",
            email: "",
          } as any,
          isCurrent: true,
        },
      ];
    }

    return {
      fileId,
      fileName: file.name,
      currentVersionId: file.currentVersionId,
      versions: formattedVersions,
    };
  }

  /**
   * Get a presigned download URL for a specific version snapshot
   */
  async getDownloadUrl(userId: string, fileId: string, versionId: string) {
    const canDownload = await permissionsService.canDownload(userId, fileId);
    if (!canDownload) {
      throw ApiError.forbidden("You do not have permission to download this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    // Special case for initial-v1
    if (versionId === "initial-v1") {
      const url = await storage.getSignedDownloadUrl(file.storageKey, 3600, file.name);
      return {
        versionNumber: 1,
        downloadUrl: url,
        expiresInSeconds: 3600,
      };
    }

    const version = await versionRepository.findById(versionId);
    if (!version || version.fileId !== fileId) {
      throw ApiError.notFound("File version not found");
    }

    const downloadName = `v${version.versionNumber}-${file.name}`;
    const url = await storage.getSignedDownloadUrl(version.storageKey, 3600, downloadName);

    return {
      versionNumber: version.versionNumber,
      downloadUrl: url,
      expiresInSeconds: 3600,
    };
  }

  /**
   * Restore a previous version to become the current version
   */
  async restoreVersion(userId: string, fileId: string, versionId: string) {
    const canEdit = await permissionsService.canEdit(userId, fileId);
    if (!canEdit) {
      throw ApiError.forbidden("You do not have permission to modify this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    let targetVersion: {
      storageKey: string;
      size: bigint;
      checksum: string | null;
      versionNumber: number;
    } | null = null;

    if (versionId === "initial-v1") {
      targetVersion = {
        storageKey: file.storageKey,
        size: file.size,
        checksum: file.checksum,
        versionNumber: 1,
      };
    } else {
      const v = await versionRepository.findById(versionId);
      if (!v || v.fileId !== fileId) {
        throw ApiError.notFound("Target version not found");
      }
      targetVersion = {
        storageKey: v.storageKey,
        size: v.size,
        checksum: v.checksum,
        versionNumber: v.versionNumber,
      };
    }

    const currentMax = await versionRepository.getMaxVersionNumber(fileId);
    const nextVersionNum = Math.max(currentMax, 1) + 1;
    const safeFilename = file.name.replace(/[^\w.-]/g, "_");
    const restoredStorageKey = `users/${file.ownerId}/files/${fileId}/v${nextVersionNum}/${safeFilename}`;

    // Copy storage object to new restored storage key
    await storage.copyObject(targetVersion.storageKey, restoredStorageKey);

    // Create a new version entry for this restored state
    const newVersion = await versionRepository.create({
      fileId,
      versionNumber: nextVersionNum,
      storageKey: restoredStorageKey,
      size: targetVersion.size,
      checksum: targetVersion.checksum,
      createdById: userId,
    });

    // Update the main file record
    await prisma.file.update({
      where: { id: fileId },
      data: {
        storageKey: restoredStorageKey,
        size: targetVersion.size,
        checksum: targetVersion.checksum,
        currentVersionId: newVersion.id,
        updatedAt: new Date(),
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        actorId: userId,
        action: "FILE_RESTORED_VERSION",
        resourceId: fileId,
        resourceType: "FILE",
        resourceName: file.name,
        metadata: {
          restoredFromVersion: targetVersion.versionNumber,
          newVersionNumber: nextVersionNum,
        },
      },
    });

    return {
      success: true,
      message: `File "${file.name}" restored to version ${targetVersion.versionNumber} (now version ${nextVersionNum})`,
      newVersionNumber: nextVersionNum,
    };
  }

  /**
   * Delete a historical version
   */
  async deleteVersion(userId: string, fileId: string, versionId: string) {
    const canEdit = await permissionsService.canEdit(userId, fileId);
    if (!canEdit) {
      throw ApiError.forbidden("You do not have permission to delete versions of this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const version = await versionRepository.findById(versionId);
    if (!version || version.fileId !== fileId) {
      throw ApiError.notFound("Version not found");
    }

    if (version.id === file.currentVersionId || version.storageKey === file.storageKey) {
      throw ApiError.badRequest("Cannot delete the current active version of a file");
    }

    // Only delete from storage if no other version points to the same storageKey
    const otherReferences = await prisma.fileVersion.count({
      where: {
        storageKey: version.storageKey,
        id: { not: versionId },
      },
    });

    if (otherReferences === 0 && file.storageKey !== version.storageKey) {
      try {
        await storage.delete(version.storageKey);
      } catch (err) {
        console.error(`Failed to delete storage key ${version.storageKey}:`, err);
      }
    }

    await versionRepository.delete(versionId);

    return {
      success: true,
      message: `Version ${version.versionNumber} deleted successfully`,
    };
  }

  /**
   * Upload a new version directly for an existing file
   */
  async uploadNewVersion(
    userId: string,
    fileId: string,
    fileBuffer: Buffer,
    mimeType: string,
    size: number
  ) {
    const canEdit = await permissionsService.canEdit(userId, fileId);
    if (!canEdit) {
      throw ApiError.forbidden("You do not have permission to modify this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    let currentMax = await versionRepository.getMaxVersionNumber(fileId);

    // If file has no versions recorded yet, record current as version 1
    if (currentMax === 0) {
      await versionRepository.create({
        fileId,
        versionNumber: 1,
        storageKey: file.storageKey,
        size: file.size,
        checksum: file.checksum,
        createdById: file.ownerId,
      });
      currentMax = 1;
    }

    const nextVer = currentMax + 1;
    const safeFilename = file.name.replace(/[^\w.-]/g, "_");
    const newStorageKey = `users/${file.ownerId}/files/${fileId}/v${nextVer}/${safeFilename}`;

    // Upload new buffer
    await storage.upload(newStorageKey, fileBuffer, mimeType);

    const sizeBigInt = BigInt(size);
    const sizeDiff = sizeBigInt - file.size;

    // Create new version record
    const newVersion = await versionRepository.create({
      fileId,
      versionNumber: nextVer,
      storageKey: newStorageKey,
      size: sizeBigInt,
      createdById: userId,
    });

    // Update File record
    await prisma.file.update({
      where: { id: fileId },
      data: {
        storageKey: newStorageKey,
        size: sizeBigInt,
        mimeType,
        currentVersionId: newVersion.id,
        updatedAt: new Date(),
      },
    });

    // Update user quota if size increased
    if (sizeDiff > BigInt(0)) {
      await prisma.user.update({
        where: { id: file.ownerId },
        data: {
          storageUsed: { increment: sizeDiff },
        },
      });
    }

    // Activity
    await prisma.activity.create({
      data: {
        actorId: userId,
        action: "FILE_VERSION_UPLOADED",
        resourceId: fileId,
        resourceType: "FILE",
        resourceName: file.name,
        metadata: {
          versionNumber: nextVer,
          size: sizeBigInt.toString(),
        },
      },
    });

    return {
      success: true,
      message: `Version ${nextVer} of "${file.name}" uploaded successfully`,
      versionNumber: nextVer,
      versionId: newVersion.id,
    };
  }
}

export const versionService = new VersionService();
