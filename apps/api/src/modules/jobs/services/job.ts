import { JobRepository } from '../repositories/job.js';
import { QueueRepository } from '../../queues/repositories/queue.js';
import { ProjectRepository } from '../../projects/repositories/project.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '../../../errors/index.js';
import { MembershipRole, Job, JobStatus, QueueStatus } from '@prisma/client';
import { logger } from '../../../logger/index.js';

export class JobService {
  /**
   * Submits a job to a queue.
   */
  public static async submit(
    operatorUserId: string,
    queueId: string,
    data: {
      payload: Record<string, unknown>;
      priority?: number;
      metadata?: Record<string, unknown>;
      idempotencyKey?: string;
    },
  ): Promise<Job> {
    // 1. Find queue
    const queue = await QueueRepository.findById(queueId);
    if (!queue) {
      logger.warn({ queueId }, 'Submission rejected: Queue not found.');
      throw new NotFoundError('Queue not found.');
    }

    // 2. Validate queue operational availability status
    // Must be ACTIVE, Enabled (isActive === true), Not Archived, Not Draining, Not Paused
    if (
      queue.status !== QueueStatus.ACTIVE ||
      !queue.isActive ||
      queue.isArchived
    ) {
      logger.warn(
        { queueId, status: queue.status },
        'Submission rejected: Queue unavailable.',
      );
      throw new ValidationError(
        'Queue is not active or unavailable for job submission.',
      );
    }

    // 3. Find project associated with the queue
    const project = await ProjectRepository.findById(queue.projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // 4. Assert membership & authorization
    // Owners, Admins, Maintainers, and Developers can submit jobs. Read-only viewers cannot.
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (operatorRole === MembershipRole.READ_ONLY) {
      throw new AuthorizationError(
        'Access denied. Read-only viewers cannot submit jobs.',
      );
    }

    // 5. Idempotency Key validation check
    if (data.idempotencyKey) {
      const existing = await JobRepository.findByIdempotencyKey(
        queueId,
        data.idempotencyKey,
      );
      if (existing) {
        logger.info(
          { queueId, idempotencyKey: data.idempotencyKey },
          'Job submission idempotency match.',
        );
        return existing;
      }
    }

    // 6. Create Job
    const job = await JobRepository.create({
      queueId,
      payload: data.payload,
      priority: data.priority ?? 1,
      metadata: data.metadata || {},
      idempotencyKey: data.idempotencyKey ?? null,
      submittedBy: operatorUserId,
    });

    logger.info(
      { queueId, jobId: job.id, operatorUserId },
      'Job submitted successfully.',
    );
    return job;
  }

  /**
   * Cancels a queued job.
   */
  public static async cancel(
    operatorUserId: string,
    jobId: string,
  ): Promise<Job> {
    // 1. Find job
    const job = await JobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found.');
    }

    // 2. Find queue & project
    const queue = await QueueRepository.findById(job.queueId);
    if (!queue) {
      throw new NotFoundError('Queue not found.');
    }

    const project = await ProjectRepository.findById(queue.projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // 3. Assert membership & role
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (operatorRole === MembershipRole.READ_ONLY) {
      throw new AuthorizationError(
        'Access denied. Read-only viewers cannot cancel jobs.',
      );
    }

    // 4. Check initial lifecycle state: Only QUEUED jobs can be cancelled
    if (job.status !== JobStatus.QUEUED) {
      throw new ValidationError(
        `Cannot cancel job. Job is already in ${job.status} state.`,
      );
    }

    // 5. Update status to CANCELLED
    const updated = await JobRepository.updateStatus(
      jobId,
      JobStatus.CANCELLED,
    );
    logger.warn({ jobId, operatorUserId }, 'Job cancelled.');
    return updated;
  }
}
