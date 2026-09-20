import { prisma } from "../config/database";

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export class FolderRepository {
  async create(data: {
    ownerId: string;
    parentId?: string | null;
    name: string;
    color?: string | null;
  }) {
    return prisma.folder.create({
      data: {
        ownerId: data.ownerId,
        parentId: data.parentId || null,
        name: data.name.trim(),
        color: data.color || null,
      },
    });
  }

  async findById(id: string, ownerId: string) {
    return prisma.folder.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findByNameAndParent(name: string, ownerId: string, parentId?: string | null) {
    return prisma.folder.findFirst({
      where: {
        name: name.trim(),
        ownerId,
        parentId: parentId || null,
        deletedAt: null,
      },
    });
  }

  async listSubFolders(ownerId: string, parentId?: string | null) {
    return prisma.folder.findMany({
      where: {
        ownerId,
        parentId: parentId || null,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            subFolders: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async getBreadcrumbs(folderId: string, ownerId: string): Promise<BreadcrumbItem[]> {
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder: { id: string; name: string; parentId: string | null } | null = await prisma.folder.findFirst({
        where: { id: currentId, ownerId, deletedAt: null },
        select: { id: true, name: true, parentId: true },
      });

      if (!folder) break;

      breadcrumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return breadcrumbs;
  }

  async update(
    id: string,
    ownerId: string,
    data: { name?: string; color?: string | null; parentId?: string | null }
  ) {
    return prisma.folder.updateMany({
      where: { id, ownerId, deletedAt: null },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    });
  }

  async softDelete(id: string, ownerId: string) {
    const now = new Date();
    // Recursively collect all descendant folder IDs
    const allFolderIds: string[] = [id];
    let queue: string[] = [id];

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;
      const children = await prisma.folder.findMany({
        where: { parentId: currentParentId, ownerId, deletedAt: null },
        select: { id: true },
      });

      for (const child of children) {
        allFolderIds.push(child.id);
        queue.push(child.id);
      }
    }

    // Soft delete all gathered folders
    await prisma.folder.updateMany({
      where: { id: { in: allFolderIds }, ownerId },
      data: { deletedAt: now },
    });

    // Soft delete all files inside these folders
    await prisma.file.updateMany({
      where: { folderId: { in: allFolderIds }, ownerId },
      data: { deletedAt: now },
    });

    return { affectedFolders: allFolderIds.length };
  }
}

export const folderRepository = new FolderRepository();
