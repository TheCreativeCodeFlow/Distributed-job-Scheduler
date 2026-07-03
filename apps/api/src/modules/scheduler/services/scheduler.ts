import { db } from '../../../database/index.js';
import { JobStatus } from '@prisma/client';
import { logger } from '../../../logger/index.js';

export class SchedulerService {
  private static lastPromotionCycleAt: Date | null = null;
  private static totalPromotedCount = 0;
  private static lastPromotedCount = 0;
  private static errorCount = 0;
  private static emptyScansCount = 0;
  private static lastPromotionLatencyMs = 0;

  /**
   * Promotes eligible scheduled jobs to QUEUED status.
   */
  public static async promote(batchSize: number = 50): Promise<number> {
    logger.info({ batchSize }, 'Promotion cycle started.');
    const now = new Date();
    const startTime = Date.now();

    try {
      const promoted = await db.$transaction(async (tx) => {
        // Query eligible scheduled jobs with row-level locking
        const candidates = await tx.$queryRaw<{ id: string; job_id: string }[]>`
          SELECT sj.id, sj.job_id
          FROM scheduled_jobs sj
          INNER JOIN jobs j ON sj.job_id = j.id
          WHERE sj.next_run_at <= ${now} AND (j.status = 'SCHEDULED' OR j.status = 'RETRY_PENDING')
          LIMIT ${batchSize}
          FOR UPDATE SKIP LOCKED
        `;

        if (candidates.length === 0) {
          return 0;
        }

        const jobIds = candidates.map((c) => c.job_id);

        // Update jobs status to QUEUED
        await tx.job.updateMany({
          where: {
            id: { in: jobIds },
          },
          data: {
            status: JobStatus.QUEUED,
          },
        });

        return candidates.length;
      });

      this.lastPromotionCycleAt = new Date();
      this.lastPromotedCount = promoted;
      this.totalPromotedCount += promoted;
      this.lastPromotionLatencyMs = Date.now() - startTime;

      if (promoted === 0) {
        this.emptyScansCount += 1;
        logger.info('Empty cycle: No eligible scheduled jobs to promote.');
      } else {
        logger.info({ promotedCount: promoted }, 'Jobs promoted successfully.');
      }

      return promoted;
    } catch (error) {
      this.errorCount += 1;
      logger.error({ error }, 'Promotion failure.');
      throw error;
    }
  }

  /**
   * Gets scheduler status.
   */
  public static async getStatus() {
    return {
      status: 'ACTIVE',
      lastPromotionCycleAt: this.lastPromotionCycleAt,
    };
  }

  /**
   * Gets scheduler metrics.
   */
  public static async getMetrics() {
    return {
      totalPromoted: this.totalPromotedCount,
      lastPromotedCount: this.lastPromotedCount,
      errorCount: this.errorCount,
      emptyScans: this.emptyScansCount,
      lastPromotionLatencyMs: this.lastPromotionLatencyMs,
    };
  }

  /**
   * Resets local metrics (primarily for tests).
   */
  public static resetMetrics() {
    this.lastPromotionCycleAt = null;
    this.totalPromotedCount = 0;
    this.lastPromotedCount = 0;
    this.errorCount = 0;
    this.emptyScansCount = 0;
    this.lastPromotionLatencyMs = 0;
  }
}
