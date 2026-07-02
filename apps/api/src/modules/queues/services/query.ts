import { QueueRepository } from '../repositories/queue.js';
import { ProjectRepository } from '../../projects/repositories/project.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import { NotFoundError } from '../../../errors/index.js';
import { Queue } from '@prisma/client';

export class QueueQueryService {
  /**
   * Lists all queues in a project.
   * Enforces tenant isolation.
   */
  public static async listForProject(
    userId: string,
    projectId: string,
  ): Promise<Queue[]> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      project.organizationId,
    );

    return QueueRepository.listForProject(projectId);
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
}
