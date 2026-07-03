import { db } from '../../../database/index.js';
import {
  JobStatus,
  ExecutionStatus,
  JobExecution,
  Prisma,
  LeaseStatus,
} from '@prisma/client';
import { NotFoundError, ValidationError } from '../../../errors/index.js';
import { logger } from '../../../logger/index.js';

export class JobExecutionService {
  /**
   * Starts execution of a job.
   */
  public static async startExecution(
    _operatorUserId: string,
    jobId: string,
    workerId: string,
  ): Promise<JobExecution> {
    return db.$transaction(async (tx) => {
      // 1. Retrieve job
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundError('Job not found.');
      }

      // 2. Validate status and ownership
      if (job.status !== JobStatus.CLAIMED) {
        logger.warn(
          { jobId, status: job.status },
          'Start execution attempt on non-CLAIMED job.',
        );
        throw new ValidationError('Job is not in CLAIMED status.');
      }

      if (job.workerId !== workerId) {
        logger.warn(
          { jobId, expectedWorker: job.workerId, actualWorker: workerId },
          'Start execution attempt by non-owner worker.',
        );
        throw new ValidationError('Job belongs to another worker.');
      }

      // 3. Transition CLAIMED -> RUNNING
      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING },
      });

      // 4. Create JobExecution
      const execution = await tx.jobExecution.create({
        data: {
          jobId,
          workerId,
          status: ExecutionStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      // 5. Associate active lease
      await tx.workerLease.updateMany({
        where: {
          jobId,
          workerId,
          status: { in: [LeaseStatus.ACTIVE, LeaseStatus.RENEWED] },
        },
        data: {
          executionId: execution.id,
        },
      });

      logger.info(
        { jobId, workerId, executionId: execution.id },
        'Job execution started.',
      );
      return execution;
    });
  }

  /**
   * Completes execution of a job.
   */
  public static async completeExecution(
    _operatorUserId: string,
    jobId: string,
    data: {
      workerId: string;
      result?: Record<string, unknown>;
      exitCode?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<JobExecution> {
    return db.$transaction(async (tx) => {
      // 1. Retrieve job
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundError('Job not found.');
      }

      // 2. Validate status and ownership
      if (job.status !== JobStatus.RUNNING) {
        throw new ValidationError('Job is not in RUNNING status.');
      }

      if (job.workerId !== data.workerId) {
        throw new ValidationError('Job belongs to another worker.');
      }

      // 3. Get active running execution
      const execution = await tx.jobExecution.findFirst({
        where: {
          jobId,
          workerId: data.workerId,
          status: ExecutionStatus.RUNNING,
        },
        orderBy: { startedAt: 'desc' },
      });

      if (!execution) {
        throw new NotFoundError('Active execution not found.');
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - execution.startedAt.getTime();

      // 4. Transition RUNNING -> COMPLETED
      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.COMPLETED },
      });

      // 5. Update JobExecution
      const updated = await tx.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.SUCCESS,
          finishedAt,
          durationMs,
          exitCode: data.exitCode ?? 0,
          result: (data.result as unknown as Prisma.InputJsonValue) ?? null,
          metadata: (data.metadata as unknown as Prisma.InputJsonValue) ?? {},
        },
      });

      // 6. Release active lease
      await tx.workerLease.updateMany({
        where: {
          jobId,
          workerId: data.workerId,
          status: { in: [LeaseStatus.ACTIVE, LeaseStatus.RENEWED] },
        },
        data: {
          status: LeaseStatus.RELEASED,
        },
      });

      logger.info(
        { jobId, workerId: data.workerId, durationMs },
        'Job execution completed.',
      );
      return updated;
    });
  }

  /**
   * Fails execution of a job.
   */
  public static async failExecution(
    _operatorUserId: string,
    jobId: string,
    data: {
      workerId: string;
      error?: Record<string, unknown>;
      exitCode?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<JobExecution> {
    return db.$transaction(async (tx) => {
      // 1. Retrieve job
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundError('Job not found.');
      }

      // 2. Validate status and ownership
      if (job.status !== JobStatus.RUNNING) {
        throw new ValidationError('Job is not in RUNNING status.');
      }

      if (job.workerId !== data.workerId) {
        throw new ValidationError('Job belongs to another worker.');
      }

      // 3. Get active running execution
      const execution = await tx.jobExecution.findFirst({
        where: {
          jobId,
          workerId: data.workerId,
          status: ExecutionStatus.RUNNING,
        },
        orderBy: { startedAt: 'desc' },
      });

      if (!execution) {
        throw new NotFoundError('Active execution not found.');
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - execution.startedAt.getTime();

      // 4. Transition RUNNING -> FAILED
      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED },
      });

      // 5. Update JobExecution
      const updated = await tx.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.ERROR,
          finishedAt,
          durationMs,
          exitCode: data.exitCode ?? 1,
          error: (data.error as unknown as Prisma.InputJsonValue) ?? null,
          metadata: (data.metadata as unknown as Prisma.InputJsonValue) ?? {},
        },
      });

      // 6. Release active lease
      await tx.workerLease.updateMany({
        where: {
          jobId,
          workerId: data.workerId,
          status: { in: [LeaseStatus.ACTIVE, LeaseStatus.RENEWED] },
        },
        data: {
          status: LeaseStatus.RELEASED,
        },
      });

      logger.error(
        { jobId, workerId: data.workerId, durationMs },
        'Job execution failed.',
      );
      return updated;
    });
  }

  /**
   * Retrieves latest execution details.
   */
  public static async getExecution(
    _operatorUserId: string,
    jobId: string,
  ): Promise<JobExecution> {
    const execution = await db.jobExecution.findFirst({
      where: { jobId },
      orderBy: { startedAt: 'desc' },
    });

    if (!execution) {
      throw new NotFoundError('Execution details not found.');
    }

    return execution;
  }
}
