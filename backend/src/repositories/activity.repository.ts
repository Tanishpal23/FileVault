import { prisma } from '../config/database';
import { Activity } from '@prisma/client';

export interface CreateActivityDTO {
  actorId: string;
  action: string;
  resourceId: string;
  resourceType: 'FILE' | 'FOLDER';
  resourceName: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityRepository {
  async create(data: CreateActivityDTO): Promise<Activity> {
    return prisma.activity.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        resourceId: data.resourceId,
        resourceType: data.resourceType,
        resourceName: data.resourceName,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ activities: Activity[]; total: number }> {
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({
        where: { actorId: userId },
      }),
    ]);

    return { activities, total };
  }

  async findByResource(
    resourceId: string,
    limit: number = 20
  ): Promise<Activity[]> {
    return prisma.activity.findMany({
      where: { resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const activityRepository = new ActivityRepository();
