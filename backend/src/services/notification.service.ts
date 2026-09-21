import { notificationRepository, CreateNotificationDTO } from '../repositories/notification.repository';
import { emitToUser } from '../socket/socketServer';

export class NotificationService {
  async notify(data: CreateNotificationDTO) {
    // 1. Create DB notification
    const notification = await notificationRepository.create(data);

    // 2. Real-time Socket.IO emission to user room
    emitToUser(data.userId, 'notification:new', notification);

    return notification;
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
