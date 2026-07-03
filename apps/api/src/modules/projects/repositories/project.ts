import { db } from '../../../database/index.js';
import { Project, Prisma } from '@prisma/client';

export class ProjectRepository {
  /**
   * Finds a project by ID.
   */
  public static async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Project | null> {
    const client = tx || db;
    return client.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds a project by name within an organization.
   */
  public static async findByName(
    organizationId: string,
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Project | null> {
    const client = tx || db;
    return client.project.findFirst({
      where: {
        organizationId,
        name,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds a project by slug within an organization.
   */
  public static async findBySlug(
    organizationId: string,
    slug: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Project | null> {
    const client = tx || db;
    return client.project.findFirst({
      where: {
        organizationId,
        slug: slug.toLowerCase().trim(),
        deletedAt: null,
      },
    });
  }

  /**
   * Lists all projects in an organization (excluding deleted ones).
   */
  public static async listForOrg(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Array<Project & { _count: { queues: number } }>> {
    const client = tx || db;
    return client.project.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { queues: { where: { deletedAt: null } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a new project.
   */
  public static async create(
    data: {
      organizationId: string;
      name: string;
      slug: string;
      description?: string | null;
      metadata?: Record<string, unknown>;
      settings?: Record<string, unknown>;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Project> {
    const client = tx || db;
    return client.project.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        slug: data.slug.toLowerCase().trim(),
        description: data.description ?? null,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        settings: (data.settings || {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Updates project details.
   */
  public static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      metadata?: Record<string, unknown>;
      settings?: Record<string, unknown>;
      isArchived?: boolean;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Project> {
    const client = tx || db;
    const updateData: Prisma.ProjectUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.metadata !== undefined)
      updateData.metadata = data.metadata as Prisma.InputJsonValue;
    if (data.settings !== undefined)
      updateData.settings = data.settings as Prisma.InputJsonValue;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    return client.project.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft deletes a project.
   */
  public static async softDelete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Project> {
    const client = tx || db;
    return client.project.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
