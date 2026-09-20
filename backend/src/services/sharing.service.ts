import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { sharingRepository } from "../repositories/sharing.repository";
import { fileRepository } from "../repositories/file.repository";
import { userRepository } from "../repositories/user.repository";
import { permissionsService } from "./permissions.service";
import { storage } from "../config/storage";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export class SharingService {
  /**
   * Invite / share file with another user by email
   */
  async inviteUser(
    actorId: string,
    fileId: string,
    data: { email: string; role: Role }
  ) {
    const canShare = await permissionsService.canShare(actorId, fileId);
    if (!canShare) {
      throw ApiError.forbidden("You do not have permission to share this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const targetUser = await userRepository.findByEmail(data.email);
    if (!targetUser) {
      throw ApiError.notFound("No registered user found with that email address");
    }

    if (targetUser.id === file.ownerId) {
      throw ApiError.badRequest("Cannot share file with its owner");
    }

    const actor = await userRepository.findById(actorId);

    const permission = await sharingRepository.upsertPermission(
      fileId,
      targetUser.id,
      data.role
    );

    // Record audit activity
    await prisma.activity.create({
      data: {
        actorId,
        action: "FILE_SHARED",
        resourceId: file.id,
        resourceType: "FILE",
        resourceName: file.name,
        metadata: {
          targetEmail: targetUser.email,
          role: data.role,
        },
      },
    });

    // Create in-app notification for recipient
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: "FILE_SHARED",
        title: "New file shared with you",
        message: `${actor?.name || "A team member"} shared "${file.name}" with you as ${data.role}.`,
        payload: {
          fileId: file.id,
          fileName: file.name,
          role: data.role,
        },
      },
    });

    return permission;
  }

  /**
   * List all collaborators with permissions for a file
   */
  async listCollaborators(actorId: string, fileId: string) {
    const canView = await permissionsService.canView(actorId, fileId);
    if (!canView) {
      throw ApiError.forbidden("You do not have permission to view this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    const owner = await userRepository.findById(file.ownerId);
    const collaborators = await sharingRepository.listPermissions(fileId);

    return {
      owner: {
        id: owner?.id,
        name: owner?.name,
        email: owner?.email,
        role: "OWNER",
      },
      collaborators: collaborators.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.user.name,
        email: c.user.email,
        avatarUrl: c.user.avatarUrl,
        role: c.role,
        createdAt: c.createdAt,
      })),
    };
  }

  /**
   * Update collaborator's role
   */
  async updateCollaboratorRole(
    actorId: string,
    fileId: string,
    targetUserId: string,
    role: Role
  ) {
    const canShare = await permissionsService.canShare(actorId, fileId);
    if (!canShare) {
      throw ApiError.forbidden("You do not have permission to update roles");
    }

    return sharingRepository.upsertPermission(fileId, targetUserId, role);
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(actorId: string, fileId: string, targetUserId: string) {
    const isSelf = actorId === targetUserId;
    const canShare = await permissionsService.canShare(actorId, fileId);

    if (!isSelf && !canShare) {
      throw ApiError.forbidden("You do not have permission to remove collaborators");
    }

    await sharingRepository.removePermission(fileId, targetUserId);
    return { success: true, message: "Collaborator removed" };
  }

  /**
   * List files shared with current user
   */
  async getSharedWithMe(userId: string) {
    return sharingRepository.listFilesSharedWithUser(userId);
  }

  /**
   * List files shared by current user
   */
  async getSharedByMe(userId: string) {
    return sharingRepository.listFilesSharedByUser(userId);
  }

  /**
   * Create public share link
   */
  async createShareLink(
    actorId: string,
    fileId: string,
    data: {
      role?: Role;
      password?: string;
      expiresAt?: string | null;
      downloadLimit?: number | null;
    }
  ) {
    const canShare = await permissionsService.canShare(actorId, fileId);
    if (!canShare) {
      throw ApiError.forbidden("You do not have permission to share this file");
    }

    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw ApiError.notFound("File not found");
    }

    // Cryptographically secure 32-byte hex token
    const token = crypto.randomBytes(32).toString("hex");

    let passwordHash: string | null = null;
    if (data.password && data.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }

    let parsedExpiresAt: Date | null = null;
    if (data.expiresAt) {
      parsedExpiresAt = new Date(data.expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        throw ApiError.badRequest("Invalid expiration date");
      }
    }

    const link = await sharingRepository.createShareLink({
      fileId,
      token,
      passwordHash,
      role: data.role || Role.VIEWER,
      expiresAt: parsedExpiresAt,
      downloadLimit: data.downloadLimit || null,
    });

    const publicUrl = `${env.FRONTEND_URL}/s/${token}`;

    return {
      id: link.id,
      token: link.token,
      url: publicUrl,
      role: link.role,
      hasPassword: Boolean(passwordHash),
      expiresAt: link.expiresAt,
      downloadLimit: link.downloadLimit,
      downloadCount: link.downloadCount,
      createdAt: link.createdAt,
    };
  }

  /**
   * List active share links for a file
   */
  async listShareLinks(actorId: string, fileId: string) {
    const canShare = await permissionsService.canShare(actorId, fileId);
    if (!canShare) {
      throw ApiError.forbidden("You do not have permission to view share links");
    }

    const links = await sharingRepository.listShareLinksForFile(fileId);

    return links.map((link) => ({
      id: link.id,
      token: link.token,
      url: `${env.FRONTEND_URL}/s/${link.token}`,
      role: link.role,
      hasPassword: Boolean(link.passwordHash),
      expiresAt: link.expiresAt,
      downloadLimit: link.downloadLimit,
      downloadCount: link.downloadCount,
      createdAt: link.createdAt,
    }));
  }

  /**
   * Revoke share link
   */
  async revokeShareLink(actorId: string, fileId: string, linkId: string) {
    const canShare = await permissionsService.canShare(actorId, fileId);
    if (!canShare) {
      throw ApiError.forbidden("You do not have permission to revoke share links");
    }

    await sharingRepository.revokeShareLink(linkId, fileId);
    return { success: true, message: "Share link revoked" };
  }

  /**
   * Public link inspection (No auth required)
   */
  async getPublicLinkDetails(token: string) {
    const link = await sharingRepository.findShareLinkByToken(token);
    if (!link || link.isRevoked) {
      throw ApiError.notFound("Share link is invalid or has been revoked");
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      throw ApiError.gone("This share link has expired");
    }

    if (link.downloadLimit && link.downloadCount >= link.downloadLimit) {
      throw ApiError.gone("This share link has reached its maximum download limit");
    }

    const file = link.file;

    return {
      token: link.token,
      fileName: file.name,
      fileSize: file.size.toString(),
      mimeType: file.mimeType,
      role: link.role,
      requiresPassword: Boolean(link.passwordHash),
      expiresAt: link.expiresAt,
      downloadLimit: link.downloadLimit,
      downloadCount: link.downloadCount,
      ownerName: file.owner.name,
    };
  }

  /**
   * Verify password for protected public share link
   */
  async verifyPublicLinkPassword(token: string, password?: string) {
    const link = await sharingRepository.findShareLinkByToken(token);
    if (!link || link.isRevoked) {
      throw ApiError.notFound("Share link is invalid or has been revoked");
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      throw ApiError.gone("This share link has expired");
    }

    if (link.downloadLimit && link.downloadCount >= link.downloadLimit) {
      throw ApiError.gone("This share link has reached its maximum download limit");
    }

    if (link.passwordHash) {
      if (!password) {
        throw ApiError.badRequest("Password is required to access this file");
      }
      const isValid = await bcrypt.compare(password, link.passwordHash);
      if (!isValid) {
        throw ApiError.unauthorized("Incorrect password");
      }
    }

    return {
      success: true,
      token: link.token,
      message: "Access granted",
    };
  }

  /**
   * Download public shared file and increment download counter
   */
  async downloadPublicSharedFile(
    token: string,
    password?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const link = await sharingRepository.findShareLinkByToken(token);
    if (!link || link.isRevoked) {
      throw ApiError.notFound("Share link is invalid or has been revoked");
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      throw ApiError.gone("This share link has expired");
    }

    if (link.downloadLimit && link.downloadCount >= link.downloadLimit) {
      throw ApiError.gone("This share link has reached its maximum download limit");
    }

    if (link.passwordHash) {
      if (!password) {
        throw ApiError.unauthorized("Password is required to download this file");
      }
      const isValid = await bcrypt.compare(password, link.passwordHash);
      if (!isValid) {
        throw ApiError.unauthorized("Incorrect password");
      }
    }

    // Atomic download count update & audit log
    await sharingRepository.recordDownload(link.id, ipAddress, userAgent);

    // Generate signed download URL (15 minutes validity)
    const downloadUrl = await storage.getSignedDownloadUrl(
      link.file.storageKey,
      900,
      link.file.name
    );

    return {
      downloadUrl,
      fileName: link.file.name,
      fileSize: link.file.size.toString(),
    };
  }
}

export const sharingService = new SharingService();
