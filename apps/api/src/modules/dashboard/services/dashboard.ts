import { db } from '../../../database/index.js';
import { RedisService } from '../../../redis/index.js';
import {
  WorkerStatus,
  JobStatus,
  DlqStatus,
  LeaseStatus,
  ExecutionStatus,
  Prisma,
} from '@prisma/client';

export class DashboardService {
  /**
   * Helper to retrieve user organization memberships.
   */
  public static async getUserOrgIds(userId: string): Promise<string[]> {
    const memberships = await db.organizationMember.findMany({
      where: { userId },
    });
    return memberships.map((m) => m.organizationId);
  }

  /**
   * GET /dashboard/overview
   */
  public static async getOverview(userId: string, isSystemAdmin: boolean) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const tenantFilter = isSystemAdmin
      ? {}
      : { organizationId: { in: orgIds } };
    const projectFilter = isSystemAdmin
      ? {}
      : { project: { organizationId: { in: orgIds } } };
    const jobFilter = isSystemAdmin
      ? {}
      : { queue: { project: { organizationId: { in: orgIds } } } };

    const [
      organizationsCount,
      projectsCount,
      queuesCount,
      activeWorkersCount,
      runningJobsCount,
      scheduledJobsCount,
      retryPendingJobsCount,
      dlqEntriesCount,
      completed24h,
      failed24h,
    ] = await Promise.all([
      isSystemAdmin ? db.organization.count() : Promise.resolve(orgIds.length),
      db.project.count({ where: tenantFilter }),
      db.queue.count({ where: projectFilter }),
      db.worker.count({ where: { status: { not: WorkerStatus.OFFLINE } } }),
      db.job.count({ where: { ...jobFilter, status: JobStatus.RUNNING } }),
      db.job.count({ where: { ...jobFilter, status: JobStatus.SCHEDULED } }),
      db.job.count({
        where: { ...jobFilter, status: JobStatus.RETRY_PENDING },
      }),
      db.deadLetterEntry.count({
        where: isSystemAdmin ? {} : { job: jobFilter },
      }),
      db.job.count({
        where: {
          ...jobFilter,
          status: JobStatus.COMPLETED,
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.job.count({
        where: {
          ...jobFilter,
          status: JobStatus.FAILED,
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      organizationsCount,
      projectsCount,
      queuesCount,
      activeWorkersCount,
      runningJobsCount,
      scheduledJobsCount,
      retryPendingJobsCount,
      dlqEntriesCount,
      systemUptimeSec: Math.floor(process.uptime()),
      throughput: {
        completed24h,
        failed24h,
      },
    };
  }

  /**
   * GET /dashboard/queues
   */
  public static async getQueues(userId: string, isSystemAdmin: boolean) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const where = isSystemAdmin
      ? {}
      : { project: { organizationId: { in: orgIds } } };

    const queues = await db.queue.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
    });

    return Promise.all(
      queues.map(async (queue) => {
        const [depth, waiting, running, avgExec] = await Promise.all([
          db.job.count({ where: { queueId: queue.id } }),
          db.job.count({
            where: { queueId: queue.id, status: JobStatus.QUEUED },
          }),
          db.job.count({
            where: { queueId: queue.id, status: JobStatus.RUNNING },
          }),
          db.jobExecution.aggregate({
            where: {
              job: { queueId: queue.id },
              status: ExecutionStatus.SUCCESS,
            },
            _avg: { durationMs: true },
          }),
        ]);

        const activeWorkers = await db.worker.count({
          where: {
            status: WorkerStatus.RUNNING,
            executions: {
              some: {
                status: ExecutionStatus.RUNNING,
                job: { queueId: queue.id },
              },
            },
          },
        });

        return {
          id: queue.id,
          name: queue.name,
          slug: queue.slug,
          status: queue.status,
          project: queue.project,
          depth,
          waitingJobsCount: waiting,
          runningJobsCount: running,
          averageExecutionTimeMs: avgExec._avg.durationMs || 0,
          activeWorkersCount: activeWorkers,
        };
      }),
    );
  }

  /**
   * GET /dashboard/workers
   */
  public static async getWorkers() {
    const workers = await db.worker.findMany({
      include: {
        leases: { where: { status: LeaseStatus.ACTIVE } },
        executions: { where: { status: ExecutionStatus.RUNNING } },
      },
    });

    return workers.map((w) => ({
      id: w.id,
      hostname: w.hostname,
      status: w.status,
      version: w.version,
      supportedQueues: w.supportedQueues,
      maxConcurrency: w.maxConcurrency,
      runningJobsCount: w.executions.length,
      heartbeatAgeSec: w.lastHeartbeatAt
        ? Math.floor((Date.now() - w.lastHeartbeatAt.getTime()) / 1000)
        : null,
      leaseCount: w.leases.length,
    }));
  }

  /**
   * GET /dashboard/jobs
   */
  public static async getJobs(
    userId: string,
    isSystemAdmin: boolean,
    params: {
      page: number;
      limit: number;
      status?: JobStatus;
      queueId?: string;
      workerId?: string;
      sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'scheduledAt';
      sortOrder: 'asc' | 'desc';
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const tenantFilter = isSystemAdmin
      ? {}
      : { queue: { project: { organizationId: { in: orgIds } } } };

    const where: Prisma.JobWhereInput = {
      ...tenantFilter,
    };

    if (params.status) where.status = params.status;
    if (params.queueId) where.queueId = params.queueId;
    if (params.workerId) where.workerId = params.workerId;

    if (params.startDate || params.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (params.startDate) dateFilter.gte = params.startDate;
      if (params.endDate) dateFilter.lte = params.endDate;
      where.createdAt = dateFilter;
    }

    const [total, items] = await Promise.all([
      db.job.count({ where }),
      db.job.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          queue: { select: { id: true, name: true } },
          worker: { select: { id: true, hostname: true } },
        },
      }),
    ]);

    return {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
      items,
    };
  }

  /**
   * GET /dashboard/executions
   */
  public static async getExecutions(
    userId: string,
    isSystemAdmin: boolean,
    params: {
      page: number;
      limit: number;
      status?: ExecutionStatus;
      jobId?: string;
      workerId?: string;
    },
  ) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const tenantFilter = isSystemAdmin
      ? {}
      : { job: { queue: { project: { organizationId: { in: orgIds } } } } };

    const where: Prisma.JobExecutionWhereInput = {
      ...tenantFilter,
    };

    if (params.status) where.status = params.status;
    if (params.jobId) where.jobId = params.jobId;
    if (params.workerId) where.workerId = params.workerId;

    const [total, items] = await Promise.all([
      db.jobExecution.count({ where }),
      db.jobExecution.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          job: { select: { id: true, status: true } },
          worker: { select: { id: true, hostname: true } },
        },
      }),
    ]);

    return {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
      items,
    };
  }

  /**
   * GET /dashboard/retries
   */
  public static async getRetries(userId: string, isSystemAdmin: boolean) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const jobFilter = isSystemAdmin
      ? {}
      : { queue: { project: { organizationId: { in: orgIds } } } };

    const [totalAttempts, pendingRetries, exhaustedRetries] = await Promise.all(
      [
        db.job.aggregate({
          where: jobFilter,
          _sum: { attempts: true },
        }),
        db.job.count({
          where: { ...jobFilter, status: JobStatus.RETRY_PENDING },
        }),
        db.job.count({
          where: { ...jobFilter, status: JobStatus.RETRY_EXHAUSTED },
        }),
      ],
    );

    return {
      totalAttempts: totalAttempts._sum.attempts || 0,
      pendingRetries,
      exhaustedRetries,
    };
  }

  /**
   * GET /dashboard/dlq
   */
  public static async getDlq(userId: string, isSystemAdmin: boolean) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const jobFilter = isSystemAdmin
      ? {}
      : { queue: { project: { organizationId: { in: orgIds } } } };

    const [activeEntries, replayedEntries, recentEntries] = await Promise.all([
      db.deadLetterEntry.count({
        where: {
          ...(isSystemAdmin ? {} : { job: jobFilter }),
          status: DlqStatus.ACTIVE,
        },
      }),
      db.deadLetterEntry.count({
        where: {
          ...(isSystemAdmin ? {} : { job: jobFilter }),
          status: DlqStatus.REPLAYED,
        },
      }),
      db.deadLetterEntry.findMany({
        where: isSystemAdmin ? {} : { job: jobFilter },
        orderBy: { quarantinedAt: 'desc' },
        take: 5,
        include: {
          job: {
            select: {
              id: true,
              queue: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      activeEntries,
      replayedEntries,
      recentEntries,
    };
  }

  /**
   * GET /dashboard/scheduler
   */
  public static async getScheduler() {
    const activeScheduler = await db.systemSetting.findFirst({
      where: { key: 'scheduler_state' },
    });

    const totalPromotedJobs = await db.auditLog.count({
      where: { action: 'SYSTEM_SETTING_UPDATE' }, // Representing scheduler iterations
    });

    return {
      status: activeScheduler?.value || 'ACTIVE',
      loopIntervalMs: 5000,
      totalPromotedJobs,
    };
  }

  /**
   * GET /dashboard/activity
   */
  public static async getActivity(userId: string, isSystemAdmin: boolean) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const jobFilter = isSystemAdmin
      ? {}
      : { queue: { project: { organizationId: { in: orgIds } } } };

    const recentJobs = await db.job.findMany({
      where: jobFilter,
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        queue: { select: { name: true } },
        worker: { select: { hostname: true } },
      },
    });

    return recentJobs.map((j) => ({
      id: j.id,
      queueName: j.queue.name,
      workerHostname: j.worker?.hostname || null,
      status: j.status,
      timestamp: j.updatedAt,
    }));
  }

  /**
   * GET /dashboard/timeline
   */
  public static async getTimeline(userId: string, isSystemAdmin: boolean) {
    const orgIds = isSystemAdmin ? [] : await this.getUserOrgIds(userId);
    const jobFilter = isSystemAdmin
      ? {}
      : { queue: { project: { organizationId: { in: orgIds } } } };

    const recentJobs = await db.job.findMany({
      where: jobFilter,
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        queue: { select: { name: true } },
      },
    });

    return recentJobs.map((j) => ({
      id: j.id,
      event: 'job.submitted',
      message: `Job ${j.id} submitted to queue '${j.queue.name}'`,
      timestamp: j.createdAt,
    }));
  }

  /**
   * GET /dashboard/health
   */
  public static async getHealth() {
    const start = Date.now();
    let dbStatus = 'HEALTHY';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'UNHEALTHY';
    }

    const redisHealth = await RedisService.checkHealth();
    const redisStatus = redisHealth.ok ? 'HEALTHY' : 'UNHEALTHY';

    const activeWorkers = await db.worker.count({
      where: { status: { not: WorkerStatus.OFFLINE } },
    });

    return {
      databaseStatus: dbStatus,
      redisStatus,
      schedulerStatus: 'HEALTHY',
      workerAvailability: activeWorkers > 0 ? 'AVAILABLE' : 'DEGRADED',
      latencyMs: Date.now() - start,
    };
  }
}
