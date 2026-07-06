import { QueueRepository } from '../repositories/queue.js';
import { ProjectRepository } from '../../projects/repositories/project.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '../../../errors/index.js';
import { MembershipRole, Queue, QueueStatus } from '@prisma/client';
import { logger } from '../../../logger/index.js';
import {
  EventBusService,
  SSE_EVENT_TYPES,
} from '../../events/EventBusService.js';

export class QueueService {
  /**
   * Creates a new queue in the project.
   */
  public static async create(
    operatorUserId: string,
    projectId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
      priority?: number;
      maxConcurrency?: number;
      rateLimit?: number;
      retryPolicyId: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Queue> {
    // 1. Find project
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // 2. Assert membership & role (Owner, Admin, or Project Maintainer)
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to create queues.',
      );
    }

    // 3. Validate unique queue name per project
    const existingName = await QueueRepository.findByName(projectId, data.name);
    if (existingName) {
      throw new ConflictError(
        'A queue with this name already exists in this project.',
      );
    }

    // 4. Validate unique queue slug per project
    const existingSlug = await QueueRepository.findBySlug(projectId, data.slug);
    if (existingSlug) {
      throw new ConflictError(
        'A queue with this slug already exists in this project.',
      );
    }

    // 5. Create queue
    const queue = await QueueRepository.create({
      projectId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      priority: data.priority ?? 0,
      maxConcurrency: data.maxConcurrency ?? 10,
      rateLimit: data.rateLimit ?? null,
      retryPolicyId: data.retryPolicyId,
      metadata: data.metadata || {},
    });

    logger.info(
      { projectId, queueId: queue.id, operatorUserId },
      'Queue created successfully.',
    );
    return queue;
  }

  /**
   * Updates an existing queue.
   */
  public static async update(
    operatorUserId: string,
    queueId: string,
    updates: {
      name?: string;
      description?: string;
      priority?: number;
      maxConcurrency?: number;
      rateLimit?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Queue> {
    // 1. Find queue & project
    const queue = await QueueRepository.findById(queueId);
    if (!queue) {
      throw new NotFoundError('Queue not found.');
    }

    const project = await ProjectRepository.findById(queue.projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // 2. Assert membership
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    // 3. RBAC checks: Developers can only update metadata; Others can update anything
    if (operatorRole === MembershipRole.DEVELOPER) {
      if (
        updates.name !== undefined ||
        updates.description !== undefined ||
        updates.priority !== undefined ||
        updates.maxConcurrency !== undefined ||
        updates.rateLimit !== undefined
      ) {
        throw new AuthorizationError(
          'Access denied. Developers can only update queue metadata.',
        );
      }
    } else if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to update queue details.',
      );
    }

    // 4. Check name conflict
    if (updates.name && updates.name !== queue.name) {
      const existingName = await QueueRepository.findByName(
        queue.projectId,
        updates.name,
      );
      if (existingName) {
        throw new ConflictError(
          'A queue with this name already exists in this project.',
        );
      }
    }

    // 5. Save updates
    const updatePayload: {
      name?: string;
      description?: string | null;
      priority?: number;
      maxConcurrency?: number;
      rateLimit?: number | null;
      metadata?: Record<string, unknown>;
    } = {};

    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.description !== undefined) {
      updatePayload.description = updates.description ?? null;
    }
    if (updates.priority !== undefined)
      updatePayload.priority = updates.priority;
    if (updates.maxConcurrency !== undefined) {
      updatePayload.maxConcurrency = updates.maxConcurrency;
    }
    if (updates.rateLimit !== undefined) {
      updatePayload.rateLimit = updates.rateLimit ?? null;
    }
    if (updates.metadata !== undefined)
      updatePayload.metadata = updates.metadata;

    const updated = await QueueRepository.update(queueId, updatePayload);
    logger.info({ queueId, operatorUserId }, 'Queue updated successfully.');
    return updated;
  }

  /**
   * Archives a queue.
   */
  public static async archive(
    operatorUserId: string,
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

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to archive queue.',
      );
    }

    const updated = await QueueRepository.update(queueId, {
      isArchived: true,
      status: QueueStatus.ARCHIVED,
    });
    logger.warn({ queueId, operatorUserId }, 'Queue archived.');
    return updated;
  }

  /**
   * Restores an archived queue.
   */
  public static async restore(
    operatorUserId: string,
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

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to restore queue.',
      );
    }

    const updated = await QueueRepository.update(queueId, {
      isArchived: false,
      status: QueueStatus.ACTIVE,
    });
    logger.info({ queueId, operatorUserId }, 'Queue restored.');
    return updated;
  }

  /**
   * Soft deletes a queue.
   */
  public static async delete(
    operatorUserId: string,
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

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to delete queue.',
      );
    }

    const deleted = await QueueRepository.softDelete(queueId);
    logger.warn({ queueId, operatorUserId }, 'Queue soft deleted.');
    return deleted;
  }

  private static readonly VALID_TRANSITIONS: Record<
    QueueStatus,
    QueueStatus[]
  > = {
    [QueueStatus.ACTIVE]: [
      QueueStatus.PAUSED,
      QueueStatus.DRAINING,
      QueueStatus.DISABLED,
      QueueStatus.ARCHIVED,
    ],
    [QueueStatus.PAUSED]: [
      QueueStatus.ACTIVE,
      QueueStatus.DRAINING,
      QueueStatus.DISABLED,
      QueueStatus.ARCHIVED,
    ],
    [QueueStatus.DRAINING]: [
      QueueStatus.ACTIVE,
      QueueStatus.PAUSED,
      QueueStatus.DISABLED,
      QueueStatus.ARCHIVED,
    ],
    [QueueStatus.DISABLED]: [
      QueueStatus.ACTIVE, // Can only transition to ACTIVE (enable)
      QueueStatus.ARCHIVED,
    ],
    [QueueStatus.ARCHIVED]: [
      QueueStatus.ACTIVE, // Can only transition to ACTIVE (restore)
    ],
  };

  private static validateTransition(
    current: QueueStatus,
    next: QueueStatus,
  ): void {
    const allowed = QueueService.VALID_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new ValidationError(
        `Invalid queue state transition from ${current} to ${next}.`,
      );
    }
  }

  private static async updateStatus(
    operatorUserId: string,
    queueId: string,
    targetStatus: QueueStatus,
  ): Promise<Queue> {
    const queue = await QueueRepository.findById(queueId);
    if (!queue) {
      throw new NotFoundError('Queue not found.');
    }

    const project = await ProjectRepository.findById(queue.projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        `Access denied. Insufficient privileges to update queue state to ${targetStatus}.`,
      );
    }

    // Perform state transition validation
    QueueService.validateTransition(queue.status, targetStatus);

    const updated = await QueueRepository.update(queueId, {
      status: targetStatus,
    });

    return updated;
  }

  public static async pause(
    operatorUserId: string,
    queueId: string,
  ): Promise<Queue> {
    const updated = await QueueService.updateStatus(
      operatorUserId,
      queueId,
      QueueStatus.PAUSED,
    );
    logger.info({ queueId, operatorUserId }, 'Queue paused.');
    EventBusService.emitEvent(SSE_EVENT_TYPES.QUEUE_PAUSED, { queueId });
    return updated;
  }

  public static async resume(
    operatorUserId: string,
    queueId: string,
  ): Promise<Queue> {
    const updated = await QueueService.updateStatus(
      operatorUserId,
      queueId,
      QueueStatus.ACTIVE,
    );
    logger.info({ queueId, operatorUserId }, 'Queue resumed.');
    EventBusService.emitEvent(SSE_EVENT_TYPES.QUEUE_RESUMED, { queueId });
    return updated;
  }

  public static async drain(
    operatorUserId: string,
    queueId: string,
  ): Promise<Queue> {
    const updated = await QueueService.updateStatus(
      operatorUserId,
      queueId,
      QueueStatus.DRAINING,
    );
    logger.info({ queueId, operatorUserId }, 'Queue drained.');
    EventBusService.emitEvent(SSE_EVENT_TYPES.QUEUE_DRAINING, { queueId });
    return updated;
  }

  public static async disable(
    operatorUserId: string,
    queueId: string,
  ): Promise<Queue> {
    const updated = await QueueService.updateStatus(
      operatorUserId,
      queueId,
      QueueStatus.DISABLED,
    );
    logger.warn({ queueId, operatorUserId }, 'Queue disabled.');
    EventBusService.emitEvent(SSE_EVENT_TYPES.QUEUE_DISABLED, { queueId });
    return updated;
  }

  public static async enable(
    operatorUserId: string,
    queueId: string,
  ): Promise<Queue> {
    const updated = await QueueService.updateStatus(
      operatorUserId,
      queueId,
      QueueStatus.ACTIVE,
    );
    logger.info({ queueId, operatorUserId }, 'Queue enabled.');
    EventBusService.emitEvent(SSE_EVENT_TYPES.QUEUE_ENABLED, { queueId });
    return updated;
  }
}
