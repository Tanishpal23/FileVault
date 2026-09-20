import { activityRepository, CreateActivityDTO } from '../repositories/activity.repository';
import { Activity } from '@prisma/client';

export class ActivityService {
  async logActivity(data: CreateActivityDTO): Promise<Activity> {
    try {
      return await activityRepository.create(data);
    } catch (err) {
      console.error('Failed to record activity log:', err);
      // Non-blocking: fail gracefully without crashing caller
      return null as any;
    }
  }

  async getUserActivities(userId: string, limit: number = 20, offset: number = 0) {
    return activityRepository.findByUser(userId, limit, offset);
  }

  async getResourceActivities(resourceId: string, limit: number = 20) {
    return activityRepository.findByResource(resourceId, limit);
  }
}

export const activityService = new ActivityService();
