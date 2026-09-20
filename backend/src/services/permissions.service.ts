import { prisma } from "../config/database";
import { Role } from "@prisma/client";

export class PermissionsService {
  /**
   * Resolve user's highest role on a file
   */
  async resolveRole(
    userId: string | undefined,
    fileId: string
  ): Promise<"OWNER" | "EDITOR" | "COMMENTER" | "VIEWER" | "NONE"> {
    if (!userId) return "NONE";

    const file = await prisma.file.findFirst({
      where: { id: fileId, deletedAt: null },
      select: { ownerId: true },
    });

    if (!file) return "NONE";
    if (file.ownerId === userId) return "OWNER";

    const perm = await prisma.filePermission.findUnique({
      where: { fileId_userId: { fileId, userId } },
    });

    if (!perm) return "NONE";

    switch (perm.role) {
      case Role.EDITOR:
        return "EDITOR";
      case Role.COMMENTER:
        return "COMMENTER";
      case Role.VIEWER:
        return "VIEWER";
      default:
        return "NONE";
    }
  }

  async canView(userId: string | undefined, fileId: string): Promise<boolean> {
    const role = await this.resolveRole(userId, fileId);
    return role !== "NONE";
  }

  async canDownload(userId: string | undefined, fileId: string): Promise<boolean> {
    const role = await this.resolveRole(userId, fileId);
    return role !== "NONE";
  }

  async canEdit(userId: string, fileId: string): Promise<boolean> {
    const role = await this.resolveRole(userId, fileId);
    return role === "OWNER" || role === "EDITOR";
  }

  async canDelete(userId: string, fileId: string): Promise<boolean> {
    const role = await this.resolveRole(userId, fileId);
    return role === "OWNER";
  }

  async canShare(userId: string, fileId: string): Promise<boolean> {
    const role = await this.resolveRole(userId, fileId);
    return role === "OWNER" || role === "EDITOR";
  }

  async canComment(userId: string, fileId: string): Promise<boolean> {
    const role = await this.resolveRole(userId, fileId);
    return role === "OWNER" || role === "EDITOR" || role === "COMMENTER";
  }
}

export const permissionsService = new PermissionsService();
