import { db } from '../../../database/index.js';
import { JobStatus, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../../errors/index.js';
import { logger } from '../../../logger/index.js';

export class RetryService {
  private static totalRetriedCount = 0;
  private static totalExhaustedCount = 0;

  /**
   * Evaluates and schedules retry or marks job as exhausted upon execution failure.
   */
  public static async handleFailure(
    tx: Prisma.TransactionClient,
    jobId: string,
  ): Promise<void> {
    const job = await tx.job.findUnique({
      where: { id: jobId },
      include: {
        queue: {
          include: {
            retryPolicy: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found.');
    }

    const nextAttempt = job.attempts + 1;
    const maxAttempts = job.queue.retryPolicy.maxAttempts;

    if (nextAttempt < maxAttempts) {
      // Calculate exponential backoff: delay = initialDelay * (factor ^ (attempt - 1))
      const initialDelayMs = 5000;
      const factor = job.queue.retryPolicy.backoffFactor;
      const backoffDelay = Math.floor(
        initialDelayMs * Math.pow(factor, nextAttempt - 1),
      );

      // Apply bounded random jitter between 0 and 1000ms
      const jitter = Math.floor(Math.random() * 1000);
      const totalDelay = backoffDelay + jitter;

      await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.RETRY_PENDING,
          attempts: nextAttempt,
        },
      });

      await tx.scheduledJob.upsert({
        where: { jobId },
        create: {
          jobId,
          queueId: job.queueId,
          nextRunAt: new Date(Date.now() + totalDelay),
        },
        update: {
          nextRunAt: new Date(Date.now() + totalDelay),
        },
      });

      this.totalRetriedCount += 1;
      logger.info(
        { jobId, nextAttempt, delayMs: totalDelay },
        'Retry scheduled successfully.',
      );
    } else {
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.RETRY_EXHAUSTED,
          attempts: nextAttempt,
        },
      });

      this.totalExhaustedCount += 1;
      logger.warn(
        { jobId, attemptsCount: nextAttempt },
        'Retry attempts exhausted.',
      );
    }
  }

  /**
   * Manually retries failed, pending or exhausted jobs.
   */
  public static async manualRetry(jobId: string) {
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found.');
    }

    const allowedStatuses: JobStatus[] = [
      JobStatus.FAILED,
      JobStatus.RETRY_PENDING,
      JobStatus.RETRY_EXHAUSTED,
    ];

    if (!allowedStatuses.includes(job.status)) {
      throw new ValidationError(
        `Cannot manually retry job in ${job.status} status. Only FAILED, RETRY_PENDING or RETRY_EXHAUSTED are allowed.`,
      );
    }

    return db.$transaction(async (tx) => {
      // 1. Delete associated scheduled job record if exists
      await tx.scheduledJob.deleteMany({
        where: { jobId },
      });

      // 2. Clear worker ID and reset to QUEUED
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.QUEUED,
          workerId: null,
          attempts: job.attempts + 1,
        },
      });

      logger.info(
        { jobId, attempts: updatedJob.attempts },
        'Manual retry triggered.',
      );
      return updatedJob;
    });
  }

  /**
   * Gets details on retries for a specific job.
   */
  public static async getRetryStatus(jobId: string) {
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        queue: {
          include: {
            retryPolicy: true,
          },
        },
        scheduledJob: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found.');
    }

    return {
      attempts: job.attempts,
      maxAttempts: job.queue.retryPolicy.maxAttempts,
      backoffFactor: job.queue.retryPolicy.backoffFactor,
      status: job.status,
      nextRetryAt: job.scheduledJob?.nextRunAt ?? null,
    };
  }

  /**
   * Gets operational metrics.
   */
  public static async getMetrics() {
    const activeRetryPending = await db.job.count({
      where: { status: JobStatus.RETRY_PENDING },
    });

    return {
      totalRetried: this.totalRetriedCount,
      totalExhausted: this.totalExhaustedCount,
      activeRetryPending,
    };
  }

  /**
   * Resets local metrics (primarily for tests).
   */
  public static resetMetrics() {
    this.totalRetriedCount = 0;
    this.totalExhaustedCount = 0;
  }
}
