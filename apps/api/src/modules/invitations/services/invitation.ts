import crypto from 'crypto';
import { db } from '../../../database/index.js';
import { InvitationRepository } from '../repositories/invitation.js';
import { OrganizationRepository } from '../../organizations/repositories/organization.js';
import { UserRepository } from '../../auth/repositories/user.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
} from '../../../errors/index.js';
import {
  MembershipRole,
  InvitationStatus,
  OrganizationInvitation,
} from '@prisma/client';
import { logger } from '../../../logger/index.js';

export class InvitationService {
  private static readonly INVITATION_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 Hours

  /**
   * Creates an invitation for an email.
   */
  public static async create(
    operatorUserId: string,
    organizationId: string,
    email: string,
    role: MembershipRole,
  ): Promise<OrganizationInvitation> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Get operator membership & check authorization
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN
    ) {
      throw new AuthorizationError(
        'Access denied. Only Owners and Administrators can create invitations.',
      );
    }

    if (operatorRole === MembershipRole.ORG_ADMIN) {
      if (
        role === MembershipRole.ORG_OWNER ||
        role === MembershipRole.ORG_ADMIN
      ) {
        throw new AuthorizationError(
          'Access denied. Administrators cannot invite owners or other administrators.',
        );
      }
    }

    // 2. Reject if email belongs to an existing member of the organization
    const targetUser = await UserRepository.findByEmail(normalizedEmail);
    if (targetUser) {
      const isMember = await OrganizationRepository.getMembership(
        targetUser.id,
        organizationId,
      );
      if (isMember) {
        throw new ConflictError(
          'User is already a member of this organization.',
        );
      }
    }

    // 3. Reject if an active invitation already exists for this email address
    const active = await InvitationRepository.findActiveInvitation(
      organizationId,
      normalizedEmail,
    );
    if (active) {
      throw new ConflictError(
        'An active invitation already exists for this email address.',
      );
    }

    // 4. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.INVITATION_EXPIRY_MS);

    // 5. Save invitation in database
    const invitation = await InvitationRepository.create({
      organizationId,
      email: normalizedEmail,
      role,
      inviterId: operatorUserId,
      token,
      expiresAt,
    });

    logger.info(
      { organizationId, email: normalizedEmail, role, operatorUserId },
      'Invitation created successfully.',
    );
    return invitation;
  }

  /**
   * Revokes a pending invitation.
   */
  public static async revoke(
    operatorUserId: string,
    organizationId: string,
    invitationId: string,
  ): Promise<OrganizationInvitation> {
    const invitation = await InvitationRepository.findById(invitationId);
    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundError('Invitation not found.');
    }

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        organizationId,
      );

    // Admins can only revoke their own invitations; owners can revoke any
    if (operatorRole === MembershipRole.ORG_ADMIN) {
      if (invitation.inviterId !== operatorUserId) {
        throw new AuthorizationError(
          'Access denied. Administrators cannot revoke invitations created by others.',
        );
      }
    } else if (operatorRole !== MembershipRole.ORG_OWNER) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to revoke invitations.',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictError('Only pending invitations can be revoked.');
    }

    const updated = await InvitationRepository.updateStatus(
      invitationId,
      InvitationStatus.REVOKED,
    );
    logger.info(
      { invitationId, operatorUserId },
      'Invitation revoked successfully.',
    );
    return updated;
  }

  /**
   * Accepts an invitation by token.
   */
  public static async accept(
    token: string,
    userId: string,
    userEmail: string,
  ): Promise<OrganizationInvitation> {
    const invitation = await InvitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    // Tenant/Recipient Check
    if (invitation.email !== userEmail.toLowerCase().trim()) {
      throw new AuthorizationError(
        'Access denied. This invitation belongs to another email address.',
      );
    }

    // Expiry check
    if (invitation.expiresAt < new Date()) {
      await InvitationRepository.updateStatus(
        invitation.id,
        InvitationStatus.EXPIRED,
      );
      throw new ConflictError('Invitation has expired.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictError(
        `Invitation cannot be accepted. Current status: ${invitation.status}`,
      );
    }

    // Check if they are already a member (e.g. added via other flows in between)
    const isMember = await OrganizationRepository.getMembership(
      userId,
      invitation.organizationId,
    );
    if (isMember) {
      throw new ConflictError('You are already a member of this organization.');
    }

    // Atomically accept invitation & create membership
    return db.$transaction(async (tx) => {
      // 1. Create membership
      await OrganizationRepository.createMembership(
        {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
          createdBy: invitation.inviterId,
        },
        tx,
      );

      // 2. Mark invitation as Accepted
      const updated = await InvitationRepository.updateStatus(
        invitation.id,
        InvitationStatus.ACCEPTED,
        tx,
      );

      logger.info(
        { invitationId: invitation.id, userId },
        'Invitation accepted successfully.',
      );
      return updated;
    });
  }

  /**
   * Declines an invitation by token.
   */
  public static async decline(
    token: string,
    userEmail: string,
  ): Promise<OrganizationInvitation> {
    const invitation = await InvitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    // Tenant/Recipient Check
    if (invitation.email !== userEmail.toLowerCase().trim()) {
      throw new AuthorizationError(
        'Access denied. This invitation belongs to another email address.',
      );
    }

    // Expiry check
    if (invitation.expiresAt < new Date()) {
      await InvitationRepository.updateStatus(
        invitation.id,
        InvitationStatus.EXPIRED,
      );
      throw new ConflictError('Invitation has expired.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictError(
        `Invitation cannot be declined. Current status: ${invitation.status}`,
      );
    }

    const updated = await InvitationRepository.updateStatus(
      invitation.id,
      InvitationStatus.DECLINED,
    );
    logger.info(
      { invitationId: invitation.id, userEmail },
      'Invitation declined successfully.',
    );
    return updated;
  }
}
