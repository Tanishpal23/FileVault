import { notificationRepository, CreateNotificationDTO } from '../repositories/notification.repository';
import { emitToUser } from '../socket/socketServer';
import { emailService } from '../email/email.service';
import { prisma } from '../config/database';

export class NotificationService {
  async notify(data: CreateNotificationDTO) {
    // 1. Create DB notification
    const notification = await notificationRepository.create(data);

    // 2. Real-time Socket.IO emission to user room
    emitToUser(data.userId, 'notification:new', notification);

    // 3. Dispatch email notification in background (non-blocking)
    this.handleEmailDispatch(data).catch((err) => {
      console.error('Email notification dispatch error:', err);
    });

    return notification;
  }

  private async handleEmailDispatch(data: CreateNotificationDTO) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    if (data.type === 'FILE_SHARED' && data.payload) {
      await emailService.sendFileSharedNotification({
        recipientEmail: user.email,
        recipientName: user.name,
        senderName: data.payload.senderName || 'A team member',
        fileName: data.payload.fileName || 'a file',
        role: data.payload.role || 'VIEWER',
        fileUrl: data.payload.fileUrl || `http://localhost:3000/dashboard/files`,
      });
    } else if (data.type === 'COMMENT_ADDED' && data.payload) {
      await emailService.sendCommentNotification({
        recipientEmail: user.email,
        recipientName: user.name,
        commenterName: data.payload.commenterName || 'A collaborator',
        fileName: data.payload.fileName || 'a file',
        commentContent: data.payload.commentContent || '',
        fileUrl: data.payload.fileUrl || `http://localhost:3000/dashboard/files`,
      });
    }
  }

  async getUserNotifications(userId: string, limit: number = 30, offset: number = 0) {
    return notificationRepository.findByUser(userId, limit, offset);
  }

  async markAsRead(id: string, userId: string) {
    const updated = await notificationRepository.markAsRead(id, userId);
    if (updated) {
      emitToUser(userId, 'notification:read', { id });
    }
    return updated;
  }

  async markAllAsRead(userId: string) {
    const count = await notificationRepository.markAllAsRead(userId);
    emitToUser(userId, 'notification:read_all', {});
    return { count };
  }

  async deleteNotification(id: string, userId: string) {
    return notificationRepository.delete(id, userId);
  }
}

export const notificationService = new NotificationService();
