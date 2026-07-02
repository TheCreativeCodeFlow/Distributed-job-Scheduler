import { db } from '../../../database/index.js';
import { Organization, Prisma, MembershipRole } from '@prisma/client';

export class OrganizationRepository {
  /**
   * Finds an organization by ID (only if not soft-deleted).
   */
  public static async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Organization | null> {
    const client = tx || db;
    return client.organization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Finds an organization by slug (only if not soft-deleted).
   */
  public static async findBySlug(
    slug: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Organization | null> {
    const client = tx || db;
    return client.organization.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        deletedAt: null,
      },
    });
  }

  /**
   * Lists organizations where the user is an active member.
   */
  public static async listForUser(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Organization[]> {
    const client = tx || db;
    return client.organization.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        memberships: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Checks if user is a member of the organization, returning the membership record.
   */
  public static async getMembership(
    userId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  /**
   * Creates an organization.
   */
  public static async create(
    data: {
      name: string;
      slug: string;
      description?: string;
      logoUrl?: string;
      metadata?: Record<string, unknown>;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Organization> {
    const client = tx || db;
    return client.organization.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase().trim(),
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      },
    });
  }

  /**
   * Creates a membership record.
   */
  public static async createMembership(
    data: {
      userId: string;
      organizationId: string;
      role: MembershipRole;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.organizationMember.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
      },
    });
  }

  /**
   * Updates organization details.
   */
  public static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      metadata?: Record<string, unknown>;
      isActive?: boolean;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Organization> {
    const client = tx || db;
    const updateData: Prisma.OrganizationUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata as Prisma.InputJsonValue;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return client.organization.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft deletes an organization.
   */
  public static async softDelete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Organization> {
    const client = tx || db;
    return client.organization.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
