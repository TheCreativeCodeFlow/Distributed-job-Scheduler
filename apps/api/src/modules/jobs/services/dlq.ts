import { db } from '../../../database/index.js';
import { JobStatus, DlqStatus } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../../../errors/index.js';
import { logger } from '../../../logger/index.js';
import {
  EventBusService,
  SSE_EVENT_TYPES,
} from '../../events/EventBusService.js';

export class DlqService {
  /**
   * Helper to retrieve user organization memberships.
   */
  private static async getUserOrgIds(userId: string): Promise<string[]> {
    const memberships = await db.organizationMember.findMany({
      where: { userId },
    });
    return memberships.map((m) => m.organizationId);
  }

  /**
   * Helper to validate user has organization access and retrieve entry.
   */
  private static async assertAccess(
    userId: string,
    entryId: string,
    writeAccess = false,
  ) {
    const memberships = await db.organizationMember.findMany({
      where: { userId },
    });

    const entry = await db.deadLetterEntry.findUnique({
      where: { id: entryId },
      include: {
        job: {
          include: {
            queue: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundError('Dead letter entry not found.');
    }

    const membership = memberships.find(
      (m) => m.organizationId === entry.job.queue.project.organizationId,
    );

    if (!membership) {
      throw new AuthorizationError(
        'Access denied: not a member of the owning organization.',
      );
    }

    if (writeAccess && membership.role === 'READ_ONLY') {
      throw new AuthorizationError('Access denied: insufficient permissions.');
    }

    return entry;
  }

  /**
   * List all active DLQ entries for user's organizations.
   */
  public static async list(userId: string) {
    const orgIds = await this.getUserOrgIds(userId);
    return db.deadLetterEntry.findMany({
      where: {
        job: {
          queue: {
            project: {
              organizationId: { in: orgIds },
            },
          },
        },
      },
      include: {
        job: {
          include: {
            queue: true,
          },
        },
      },
      orderBy: { quarantinedAt: 'desc' },
    });
  }

  /**
   * Get specific DLQ entry.
   */
  public static async get(userId: string, entryId: string) {
    return this.assertAccess(userId, entryId);
  }

  /**
   * Replays an entry by creating a new job and updating entry status to REPLAYED.
   */
  public static async replay(userId: string, entryId: string) {
    const entry = await this.assertAccess(userId, entryId, true);

    if (entry.status === DlqStatus.REPLAYED) {
      throw new ValidationError('Dead letter entry has already been replayed.');
    }

    logger.info({ entryId, jobId: entry.jobId }, 'Replay started.');

    try {
      const result = await db.$transaction(async (tx) => {
        // 1. Create a new job with the same parameters
        const newJob = await tx.job.create({
          data: {
            queueId: entry.job.queueId,
            payload: entry.job.payload ?? {},
            metadata: entry.job.metadata ?? {},
            priority: entry.job.priority,
            status: JobStatus.QUEUED,
            attempts: 0,
          },
        });

        // 2. Mark DLQ entry status as REPLAYED
        await tx.deadLetterEntry.update({
          where: { id: entryId },
          data: {
            status: DlqStatus.REPLAYED,
          },
        });

        return newJob;
      });

      logger.info(
        { entryId, newJobId: result.id },
        'Replay completed successfully.',
      );
      EventBusService.emitEvent(SSE_EVENT_TYPES.DEAD_LETTER_REPLAYED, {
        entryId,
        newJobId: result.id,
      });
      return result;
    } catch (error) {
      logger.error({ entryId, error }, 'Replay failed.');
      throw error;
    }
  }

  /**
   * Permanently purges the DeadLetterEntry record.
   */
  public static async purge(userId: string, entryId: string) {
    await this.assertAccess(userId, entryId, true);

    logger.info({ entryId }, 'DLQ entry purge requested.');
    await db.deadLetterEntry.delete({
      where: { id: entryId },
    });
    logger.info({ entryId }, 'DLQ entry purged.');
    return { success: true };
  }

  /**
   * Gets operational metrics.
   */
  public static async getMetrics(userId: string) {
    const orgIds = await this.getUserOrgIds(userId);

    const activeCount = await db.deadLetterEntry.count({
      where: {
        status: DlqStatus.ACTIVE,
        job: {
          queue: {
            project: {
              organizationId: { in: orgIds },
            },
          },
        },
      },
    });

    const replayedCount = await db.deadLetterEntry.count({
      where: {
        status: DlqStatus.REPLAYED,
        job: {
          queue: {
            project: {
              organizationId: { in: orgIds },
            },
          },
        },
      },
    });

    return {
      totalActive: activeCount,
      totalReplayed: replayedCount,
    };
  }
}
