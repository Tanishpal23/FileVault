import { prisma } from '../config/database';
import { Comment } from '@prisma/client';

export interface CreateCommentDTO {
  fileId: string;
  authorId: string;
  content: string;
}

export class CommentRepository {
  async create(data: CreateCommentDTO) {
    return prisma.comment.create({
      data: {
        fileId: data.fileId,
        authorId: data.authorId,
        content: data.content,
      },
      include: {
        author: {
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

  async findByFile(fileId: string) {
    return prisma.comment.findMany({
      where: { fileId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
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

  async findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });
  }

  async update(id: string, content: string) {
    return prisma.comment.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
      },
      include: {
        author: {
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

  async delete(id: string) {
    return prisma.comment.delete({
      where: { id },
    });
  }
}

export const commentRepository = new CommentRepository();
