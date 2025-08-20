import { ActivityType, PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

type LogParams = {
  type: ActivityType;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  message: string;
  metadata?: any;
};

export async function logActivity(params: LogParams, client?: PrismaClient): Promise<void> {
  const db = client || prisma;
  try {
    await db.activity.create({
      data: {
        type: params.type,
        actorUserId: params.actorUserId || null,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        message: params.message,
        metadata: params.metadata,
      },
    });
  } catch (err) {
    // non-blocking
    console.error('Failed to log activity', err);
  }
}


