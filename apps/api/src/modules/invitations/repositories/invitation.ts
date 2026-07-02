import { db } from '../../../database/index.js';
import {
  OrganizationInvitation,
  Prisma,
  InvitationStatus,
  MembershipRole,
} from '@prisma/client';

export class InvitationRepository {
  /**
   * Finds an invitation by ID.
   */
  public static async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationInvitation | null> {
    const client = tx || db;
    return client.organizationInvitation.findUnique({
      where: { id },
    });
  }

  /**
   * Finds an invitation by token.
   */
  public static async findByToken(
    token: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationInvitation | null> {
    const client = tx || db;
    return client.organizationInvitation.findUnique({
      where: { token },
    });
  }

  /**
   * Finds an active (pending and not expired) invitation for an email in an organization.
   */
  public static async findActiveInvitation(
    organizationId: string,
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationInvitation | null> {
    const client = tx || db;
    return client.organizationInvitation.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase().trim(),
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Lists all invitations for an organization.
   */
  public static async listForOrg(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationInvitation[]> {
    const client = tx || db;
    return client.organizationInvitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a new organization invitation.
   */
  public static async create(
    data: {
      organizationId: string;
      email: string;
      role: MembershipRole;
      inviterId: string;
      token: string;
      expiresAt: Date;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationInvitation> {
    const client = tx || db;
    return client.organizationInvitation.create({
      data: {
        organizationId: data.organizationId,
        email: data.email.toLowerCase().trim(),
        role: data.role,
        inviterId: data.inviterId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Updates the status of an invitation.
   */
  public static async updateStatus(
    id: string,
    status: InvitationStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationInvitation> {
    const client = tx || db;
    return client.organizationInvitation.update({
      where: { id },
      data: { status },
    });
  }
}
