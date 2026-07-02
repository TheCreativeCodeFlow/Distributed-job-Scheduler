import { JobRepository } from '../repositories/job.js';
import { QueueRepository } from '../../queues/repositories/queue.js';
import { ProjectRepository } from '../../projects/repositories/project.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import { NotFoundError } from '../../../errors/index.js';
import { Job } from '@prisma/client';

export class JobQueryService {
  /**
   * Lists all jobs in a queue.
   * Enforces tenant isolation.
   */
  public static async listForQueue(
    userId: string,
    queueId: string,
  ): Promise<Job[]> {
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

    return JobRepository.listForQueue(queueId);
  }

  /**
   * Retrieves single job details.
   * Enforces tenant isolation.
   */
  public static async getJob(userId: string, jobId: string): Promise<Job> {
    const job = await JobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found.');
    }

    const queue = await QueueRepository.findById(job.queueId);
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

    return job;
  }

  /**
   * Lists scheduled jobs in a queue.
   */
  public static async listScheduledForQueue(userId: string, queueId: string) {
    const queue = await QueueRepository.findById(queueId);
    if (!queue) {
      throw new NotFoundError('Queue not found.');
    }

    const project = await ProjectRepository.findById(queue.projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    await OrganizationAuthorizationService.assertMembership(
      userId,
      project.organizationId,
    );

    return JobRepository.listScheduledJobsForQueue(queueId);
  }

  /**
   * Retrieves single scheduled job details.
   */
  public static async getScheduledJob(userId: string, scheduledJobId: string) {
    const scheduled = await JobRepository.findScheduledJobById(scheduledJobId);
    if (!scheduled) {
      throw new NotFoundError('Scheduled job not found.');
    }

    const queue = await QueueRepository.findById(scheduled.queueId);
    if (!queue) {
      throw new NotFoundError('Queue not found.');
    }

    const project = await ProjectRepository.findById(queue.projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    await OrganizationAuthorizationService.assertMembership(
      userId,
      project.organizationId,
    );

    return scheduled;
  }
}
