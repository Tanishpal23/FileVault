import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service';

export class ActivityController {
  async getActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await activityService.getUserActivities(userId, limit, offset);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getResourceActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = req.params.resourceId as string;
      const limit = parseInt(req.query.limit as string) || 20;

      const activities = await activityService.getResourceActivities(resourceId, limit);
      res.json({
        success: true,
        data: activities,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const activityController = new ActivityController();
