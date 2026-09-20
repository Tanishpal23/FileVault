import { prisma } from "../config/database";
import { Role } from "@prisma/client";

export class SharingRepository {
  /**
   * Add or update permission for a user on a file
   */
  async upsertPermission(fileId: string, userId: string, role: Role) {
    return prisma.filePermission.upsert({
      where: {
        fileId_userId: { fileId, userId },
      },
      create: {
        fileId,
        userId,
        role,
      },
      update: {
        role,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Find a specific user permission for a file
   */
  async findPermission(fileId: string, userId: string) {
    return prisma.filePermission.findUnique({
      where: {
        fileId_userId: { fileId, userId },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * List all collaborators with permissions on a file
   */
  async listPermissions(fileId: string) {
    return prisma.filePermission.findMany({
      where: { fileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Remove a user's permission from a file
   */
  async removePermission(fileId: string, userId: string) {
    return prisma.filePermission.deleteMany({
      where: { fileId, userId },
    });
  }

  /**
   * List files shared directly with a user
   */
  async listFilesSharedWithUser(userId: string) {
    const permissions = await prisma.filePermission.findMany({
      where: {
        userId,
        file: {
          deletedAt: null,
        },
      },
      include: {
        file: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            folder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return permissions.map((p) => ({
      ...p.file,
      size: p.file.size.toString(),
      myRole: p.role,
      sharedAt: p.createdAt,
    }));
  }

  /**
   * List files owned by user that have been shared (collaborators or active links)
   */
  async listFilesSharedByUser(userId: string) {
    const files = await prisma.file.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        OR: [
          {
            permissions: {
              some: {},
            },
          },
          {
            shareLinks: {
              some: {
                isRevoked: false,
              },
            },
          },
        ],
      },
      include: {
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        shareLinks: {
          where: { isRevoked: false },
        },
        folder: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return files.map((f) => ({
      ...f,
      size: f.size.toString(),
      collaboratorCount: f.permissions.length,
      activeLinkCount: f.shareLinks.length,
    }));
  }

  /**
   * Create a public share link
   */
  async createShareLink(data: {
    fileId: string;
    token: string;
    passwordHash?: string | null;
    role?: Role;
    expiresAt?: Date | null;
    downloadLimit?: number | null;
  }) {
    return prisma.shareLink.create({
      data: {
        fileId: data.fileId,
        token: data.token,
        passwordHash: data.passwordHash || null,
        role: data.role || Role.VIEWER,
        expiresAt: data.expiresAt || null,
        downloadLimit: data.downloadLimit || null,
      },
    });
  }

  /**
   * Find share link by token
   */
  async findShareLinkByToken(token: string) {
    return prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * List share links for a file
   */
  async listShareLinksForFile(fileId: string) {
    return prisma.shareLink.findMany({
      where: { fileId, isRevoked: false },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Revoke a share link
   */
  async revokeShareLink(id: string, fileId?: string) {
    return prisma.shareLink.updateMany({
      where: {
        id,
        ...(fileId && { fileId }),
      },
      data: {
        isRevoked: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Record a download from a share link and atomically increment downloadCount
   */
  async recordDownload(shareLinkId: string, ipAddress?: string, userAgent?: string) {
    return prisma.$transaction([
      prisma.shareLink.update({
        where: { id: shareLinkId },
        data: {
          downloadCount: { increment: 1 },
        },
      }),
      prisma.shareLinkDownload.create({
        data: {
          shareLinkId,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      }),
    ]);
  }
}

export const sharingRepository = new SharingRepository();
