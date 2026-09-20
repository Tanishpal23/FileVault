import { prisma } from '../config/database';
import { Notification } from '@prisma/client';

export interface CreateNotificationDTO {
  userId: string;
  type: string;
  title: string;
  message: string;
  payload?: any;
}

export class NotificationRepository {
  async create(data: CreateNotificationDTO): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        payload: data.payload || {},
      },
    });
  }

  async findByUser(
    userId: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) return null;

    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) return false;

    await prisma.notification.delete({
      where: { id },
    });

    return true;
  }
}

export const notificationRepository = new NotificationRepository();
