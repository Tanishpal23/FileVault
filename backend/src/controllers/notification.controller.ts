import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiError } from '../utils/ApiError';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 30;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await notificationService.getUserNotifications(userId, limit, offset);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const updated = await notificationService.markAsRead(id, userId);
      if (!updated) {
        throw ApiError.notFound('Notification not found');
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const deleted = await notificationService.deleteNotification(id, userId);
      if (!deleted) {
        throw ApiError.notFound('Notification not found');
      }

      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
