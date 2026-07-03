import { QueueRepository } from '../repositories/queue.js';
import { ProjectRepository } from '../../projects/repositories/project.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import { NotFoundError } from '../../../errors/index.js';
import { Queue } from '@prisma/client';
import { JobStatus, WorkerStatus } from '@prisma/client';
import { db } from '../../../database/index.js';

type QueueOperationalMetrics = {
  waitingJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeWorkers: number;
};

type QueueWithMetrics = Queue & QueueOperationalMetrics;

export class QueueQueryService {
  /**
   * Lists all queues in a project.
   * Enforces tenant isolation.
   */
  public static async listForProject(
    userId: string,
    projectId: string,
  ): Promise<QueueWithMetrics[]> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      project.organizationId,
    );

    const queues = await QueueRepository.listForProject(projectId);
    const queueIds = queues.map((queue) => queue.id);
    if (queueIds.length === 0) return [];

    const [jobGroups, workers] = await Promise.all([
      db.job.groupBy({
        by: ['queueId', 'status'],
        where: { queueId: { in: queueIds } },
        _count: { _all: true },
      }),
      db.worker.findMany({
        where: {
          status: {
            notIn: [WorkerStatus.OFFLINE, WorkerStatus.LOST],
          },
        },
        select: { supportedQueues: true },
      }),
    ]);

    return queues.map((queue) => {
      const count = (...statuses: JobStatus[]) =>
        jobGroups
          .filter(
            (group) =>
              group.queueId === queue.id && statuses.includes(group.status),
          )
          .reduce((total, group) => total + group._count._all, 0);
      return {
        ...queue,
        waitingJobs: count(
          JobStatus.QUEUED,
          JobStatus.SCHEDULED,
          JobStatus.RETRY_PENDING,
        ),
        runningJobs: count(JobStatus.CLAIMED, JobStatus.RUNNING),
        completedJobs: count(JobStatus.COMPLETED),
        failedJobs: count(
          JobStatus.FAILED,
          JobStatus.DEAD_LETTER,
          JobStatus.RETRY_EXHAUSTED,
        ),
        activeWorkers: workers.filter((worker) =>
          worker.supportedQueues.some(
            (supported) =>
              supported === queue.id ||
              supported === queue.slug ||
              supported === queue.name,
          ),
        ).length,
      };
    });
  }

  /**
   * Retrieves single queue details.
   * Enforces tenant isolation.
   */
  public static async getQueue(
    userId: string,
    queueId: string,
  ): Promise<Queue> {
    const queue = await QueueRepository.findById(queueId);
    if (!queue) {
      throw new NotFoundError('Queue not found.');
    }

    const project = await ProjectRepository.findById(queue.projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      project.organizationId,
    );

    return queue;
  }

  public static async getOperationalStatus(
    userId: string,
    queueId: string,
  ): Promise<{ status: Queue['status'] } & QueueOperationalMetrics> {
    const queue = await this.getQueue(userId, queueId);
    const [jobGroups, activeWorkers] = await Promise.all([
      db.job.groupBy({
        by: ['status'],
        where: { queueId },
        _count: { _all: true },
      }),
      db.worker.count({
        where: {
          supportedQueues: { hasSome: [queue.id, queue.slug, queue.name] },
          status: { notIn: [WorkerStatus.OFFLINE, WorkerStatus.LOST] },
        },
      }),
    ]);
    const count = (...statuses: JobStatus[]) =>
      jobGroups
        .filter((group) => statuses.includes(group.status))
        .reduce((total, group) => total + group._count._all, 0);
    return {
      status: queue.status,
      waitingJobs: count(
        JobStatus.QUEUED,
        JobStatus.SCHEDULED,
        JobStatus.RETRY_PENDING,
      ),
      runningJobs: count(JobStatus.CLAIMED, JobStatus.RUNNING),
      completedJobs: count(JobStatus.COMPLETED),
      failedJobs: count(
        JobStatus.FAILED,
        JobStatus.DEAD_LETTER,
        JobStatus.RETRY_EXHAUSTED,
      ),
      activeWorkers,
    };
  }
}
