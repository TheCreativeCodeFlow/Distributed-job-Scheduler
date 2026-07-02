import { db } from '../../../database/index.js';
import { Job, Prisma, JobStatus } from '@prisma/client';

export class JobRepository {
  /**
   * Finds a job by ID.
   */
  public static async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Job | null> {
    const client = tx || db;
    return client.job.findFirst({
      where: { id },
    });
  }

  /**
   * Finds a job by idempotency key inside a queue.
   */
  public static async findByIdempotencyKey(
    queueId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Job | null> {
    const client = tx || db;
    return client.job.findUnique({
      where: {
        queueId_idempotencyKey: {
          queueId,
          idempotencyKey,
        },
      },
    });
  }

  /**
   * Lists all jobs in a queue.
   */
  public static async listForQueue(
    queueId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Job[]> {
    const client = tx || db;
    return client.job.findMany({
      where: { queueId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a new job.
   */
  public static async create(
    data: {
      queueId: string;
      payload: Record<string, unknown>;
      priority?: number;
      metadata?: Record<string, unknown>;
      idempotencyKey?: string | null;
      submittedBy?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Job> {
    const client = tx || db;
    return client.job.create({
      data: {
        queueId: data.queueId,
        payload: data.payload as Prisma.InputJsonValue,
        priority: data.priority ?? 1,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        idempotencyKey: data.idempotencyKey ?? null,
        submittedBy: data.submittedBy ?? null,
        status: JobStatus.QUEUED,
      },
    });
  }

  /**
   * Updates job status.
   */
  public static async updateStatus(
    id: string,
    status: JobStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<Job> {
    const client = tx || db;
    return client.job.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Finds a scheduled job by ID.
   */
  public static async findScheduledJobById(
    id: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.scheduledJob.findUnique({
      where: { id },
      include: { job: true },
    });
  }

  /**
   * Lists scheduled jobs in a queue.
   */
  public static async listScheduledJobsForQueue(
    queueId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.scheduledJob.findMany({
      where: { queueId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a scheduled job.
   */
  public static async createScheduledJob(
    data: {
      queueId: string;
      payload: Record<string, unknown>;
      priority?: number;
      metadata?: Record<string, unknown>;
      idempotencyKey?: string | null;
      submittedBy?: string | null;
      executeAt: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    const job = await client.job.create({
      data: {
        queueId: data.queueId,
        payload: data.payload as Prisma.InputJsonValue,
        priority: data.priority ?? 1,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        idempotencyKey: data.idempotencyKey ?? null,
        submittedBy: data.submittedBy ?? null,
        status: JobStatus.SCHEDULED,
        scheduledAt: data.executeAt,
      },
    });

    return client.scheduledJob.create({
      data: {
        jobId: job.id,
        queueId: data.queueId,
        nextRunAt: data.executeAt,
      },
      include: { job: true },
    });
  }
}
