import { commentRepository } from '../repositories/comment.repository';
import { permissionsService } from './permissions.service';
import { notificationService } from './notification.service';
import { activityService } from './activity.service';
import { emitToFile } from '../socket/socketServer';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/database';

export class CommentService {
  async addComment(fileId: string, authorId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      throw ApiError.badRequest('Comment content cannot be empty');
    }

    const canComment = await permissionsService.canComment(authorId, fileId);
    if (!canComment) {
      throw ApiError.forbidden('You do not have permission to comment on this file');
    }

    const file = await prisma.file.findFirst({
      where: { id: fileId, deletedAt: null },
      select: { id: true, name: true, ownerId: true },
    });

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    const comment = await commentRepository.create({
      fileId,
      authorId,
      content: trimmed,
    });

    // Broadcast realtime event to file room
    emitToFile(fileId, 'comment:added', comment);

    // Record activity
    activityService.logActivity({
      actorId: authorId,
      action: 'COMMENT_ADDED',
      resourceId: fileId,
      resourceType: 'FILE',
      resourceName: file.name,
      metadata: { commentId: comment.id },
    }).catch(() => {});

    // Notify file owner and other collaborators (excluding author)
    this.notifyCollaborators(file, comment, authorId).catch((err) => {
      console.error('Failed to notify collaborators of comment:', err);
    });

    return comment;
  }

  private async notifyCollaborators(
    file: { id: string; name: string; ownerId: string },
    comment: any,
    authorId: string
  ) {
    const recipientIds = new Set<string>();

    // Add owner if owner is not author
    if (file.ownerId !== authorId) {
      recipientIds.add(file.ownerId);
    }

    // Add collaborators who have permissions
    const permissions = await prisma.filePermission.findMany({
      where: { fileId: file.id },
      select: { userId: true },
    });

    for (const p of permissions) {
      if (p.userId !== authorId) {
        recipientIds.add(p.userId);
      }
    }

    for (const recipientId of recipientIds) {
      await notificationService.notify({
        userId: recipientId,
        type: 'COMMENT_ADDED',
        title: `New comment on "${file.name}"`,
        message: `${comment.author.name}: ${comment.content.slice(0, 120)}`,
        payload: {
          fileId: file.id,
          fileName: file.name,
          commentId: comment.id,
          commenterName: comment.author.name,
          commentContent: comment.content,
        },
      });
    }
  }

  async getComments(fileId: string, userId?: string) {
    const canView = await permissionsService.canView(userId, fileId);
    if (!canView) {
      throw ApiError.forbidden('You do not have access to view this file');
    }

    return commentRepository.findByFile(fileId);
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      throw ApiError.badRequest('Comment content cannot be empty');
    }

    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw ApiError.forbidden('You can only edit your own comments');
    }

    const updated = await commentRepository.update(commentId, trimmed);
    emitToFile(comment.fileId, 'comment:updated', updated);

    return updated;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    // Allowed if user is author OR file owner
    const isAuthor = comment.authorId === userId;
    const isOwner = comment.file.ownerId === userId;

    if (!isAuthor && !isOwner) {
      throw ApiError.forbidden('You do not have permission to delete this comment');
    }

    await commentRepository.delete(commentId);
    emitToFile(comment.fileId, 'comment:deleted', { id: commentId, fileId: comment.fileId });

    return true;
  }
}

export const commentService = new CommentService();
