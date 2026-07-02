import { db } from '../../../database/index.js';
import { Queue, Prisma, QueueStatus } from '@prisma/client';

export class QueueRepository {
  /**
   * Finds a queue by ID.
   */
  public static async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Queue | null> {
    const client = tx || db;
    return client.queue.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds a queue by name within a project.
   */
  public static async findByName(
    projectId: string,
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Queue | null> {
    const client = tx || db;
    return client.queue.findFirst({
      where: {
        projectId,
        name,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds a queue by slug within a project.
   */
  public static async findBySlug(
    projectId: string,
    slug: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Queue | null> {
    const client = tx || db;
    return client.queue.findFirst({
      where: {
        projectId,
        slug: slug.toLowerCase().trim(),
        deletedAt: null,
      },
    });
  }

  /**
   * Lists all queues in a project (excluding deleted ones).
   */
  public static async listForProject(
    projectId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Queue[]> {
    const client = tx || db;
    return client.queue.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a new queue.
   */
  public static async create(
    data: {
      projectId: string;
      name: string;
      slug: string;
      description?: string | null;
      priority?: number;
      maxConcurrency?: number;
      rateLimit?: number | null;
      retryPolicyId: string;
      metadata?: Record<string, unknown>;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Queue> {
    const client = tx || db;
    return client.queue.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        slug: data.slug.toLowerCase().trim(),
        description: data.description ?? null,
        priority: data.priority ?? 0,
        maxConcurrency: data.maxConcurrency ?? 10,
        rateLimit: data.rateLimit ?? null,
        retryPolicyId: data.retryPolicyId,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Updates queue details.
   */
  public static async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      priority?: number;
      maxConcurrency?: number;
      rateLimit?: number | null;
      status?: QueueStatus;
      metadata?: Record<string, unknown>;
      isArchived?: boolean;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Queue> {
    const client = tx || db;
    const updateData: Prisma.QueueUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.maxConcurrency !== undefined)
      updateData.maxConcurrency = data.maxConcurrency;
    if (data.rateLimit !== undefined) updateData.rateLimit = data.rateLimit;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metadata !== undefined)
      updateData.metadata = data.metadata as Prisma.InputJsonValue;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    return client.queue.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft deletes a queue.
   */
  public static async softDelete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Queue> {
    const client = tx || db;
    return client.queue.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
