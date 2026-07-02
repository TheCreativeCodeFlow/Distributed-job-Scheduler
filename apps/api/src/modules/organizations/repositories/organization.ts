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
      createdBy?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.organizationMember.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
        ...(data.createdBy !== undefined ? { createdBy: data.createdBy } : {}),
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
      isSuspended?: boolean;
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
    if (data.isSuspended !== undefined)
      updateData.isSuspended = data.isSuspended;

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

  /**
   * Lists all organization member records (including User properties).
   */
  public static async listMembers(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Finds a membership by ID (including User properties).
   */
  public static async findMemberById(
    organizationId: string,
    memberId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Finds a membership by organization ID and user ID.
   */
  public static async findMembershipByUserId(
    organizationId: string,
    userId: string,
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
   * Updates a membership's role.
   */
  public static async updateMembership(
    memberId: string,
    role: MembershipRole,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  /**
   * Deletes a membership record.
   */
  public static async deleteMembership(
    memberId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.organizationMember.delete({
      where: { id: memberId },
    });
  }
}
