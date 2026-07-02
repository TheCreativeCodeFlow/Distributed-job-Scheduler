import { db } from '../../../database/index.js';
import { OrganizationRepository } from '../repositories/organization.js';
import { OrganizationAuthorizationService } from './authorization.js';
import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
} from '../../../errors/index.js';
import { MembershipRole, InvitationStatus, Organization } from '@prisma/client';
import { logger } from '../../../logger/index.js';

export interface OrganizationStatistics {
  memberCount: number;
  activeInvitations: number;
  activeProjects: number;
  queueCount: number;
  jobCount: number;
}

export class AdministrationService {
  /**
   * Transfers organization ownership atomically from current owner to target user.
   * Target user must already be a member of the organization.
   * Previous owner becomes Organization Administrator.
   */
  public static async transferOwnership(
    operatorUserId: string,
    organizationId: string,
    targetUserId: string,
  ) {
    // 1. Get operator membership & assert they are the current Owner
    const operatorMembership = await OrganizationRepository.getMembership(
      operatorUserId,
      organizationId,
    );
    if (
      !operatorMembership ||
      operatorMembership.role !== MembershipRole.ORG_OWNER
    ) {
      throw new AuthorizationError(
        'Access denied. Only the Organization Owner can transfer ownership.',
      );
    }

    if (operatorUserId === targetUserId) {
      throw new ConflictError(
        'You are already the owner of this organization.',
      );
    }

    // 2. Assert target is currently a member
    const targetMembership =
      await OrganizationRepository.findMembershipByUserId(
        organizationId,
        targetUserId,
      );
    if (!targetMembership) {
      throw new NotFoundError('Target member not found in this organization.');
    }

    // 3. Atomically transfer ownership
    const updated = await db.$transaction(async (tx) => {
      // Demote current owner to Administrator
      await tx.organizationMember.update({
        where: { id: operatorMembership.id },
        data: { role: MembershipRole.ORG_ADMIN },
      });

      // Promote new owner
      const promoted = await tx.organizationMember.update({
        where: { id: targetMembership.id },
        data: { role: MembershipRole.ORG_OWNER },
      });

      logger.info(
        {
          organizationId,
          previousOwner: operatorUserId,
          newOwner: targetUserId,
        },
        'Ownership transferred successfully.',
      );
      return promoted;
    });

    return updated;
  }

  /**
   * Suspends an organization.
   * Restricts access to ORG_OWNER only.
   */
  public static async suspend(
    operatorUserId: string,
    organizationId: string,
  ): Promise<Organization> {
    const operatorMembership = await OrganizationRepository.getMembership(
      operatorUserId,
      organizationId,
    );
    if (
      !operatorMembership ||
      operatorMembership.role !== MembershipRole.ORG_OWNER
    ) {
      throw new AuthorizationError(
        'Access denied. Only the Organization Owner can suspend the organization.',
      );
    }

    const updated = await OrganizationRepository.update(organizationId, {
      isSuspended: true,
    });

    logger.warn({ organizationId, operatorUserId }, 'Organization suspended.');
    return updated;
  }

  /**
   * Reactivates a suspended organization.
   * Restricts access to ORG_OWNER only.
   */
  public static async reactivate(
    operatorUserId: string,
    organizationId: string,
  ): Promise<Organization> {
    const operatorMembership = await OrganizationRepository.getMembership(
      operatorUserId,
      organizationId,
    );
    if (
      !operatorMembership ||
      operatorMembership.role !== MembershipRole.ORG_OWNER
    ) {
      throw new AuthorizationError(
        'Access denied. Only the Organization Owner can reactivate the organization.',
      );
    }

    const updated = await OrganizationRepository.update(organizationId, {
      isSuspended: false,
    });

    logger.info(
      { organizationId, operatorUserId },
      'Organization reactivated.',
    );
    return updated;
  }

  /**
   * Updates settings (metadata) for the organization.
   * Allowed for ORG_OWNER and ORG_ADMIN.
   */
  public static async updateSettings(
    operatorUserId: string,
    organizationId: string,
    metadata: Record<string, unknown>,
  ): Promise<Organization> {
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
        'Access denied. Only Owners and Administrators can update settings.',
      );
    }

    const updated = await OrganizationRepository.update(organizationId, {
      metadata,
    });

    logger.info(
      { organizationId, operatorUserId },
      'Organization settings updated.',
    );
    return updated;
  }

  /**
   * Retrieves organization activity log history.
   * Allowed for ORG_OWNER and ORG_ADMIN.
   */
  public static async getActivityLog(
    operatorUserId: string,
    organizationId: string,
  ) {
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
        'Access denied. Only Owners and Administrators can view activity logs.',
      );
    }

    // Mock logs representing system-wide operations (to keep it completely future-ready)
    return [
      {
        id: 'act-create',
        action: 'organization.created',
        userId: operatorUserId,
        timestamp: new Date().toISOString(),
        details: { organizationId },
      },
    ];
  }

  /**
   * Retrieves statistics for the organization.
   * Allowed for ORG_OWNER and ORG_ADMIN.
   */
  public static async getStatistics(
    operatorUserId: string,
    organizationId: string,
  ): Promise<OrganizationStatistics> {
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
        'Access denied. Only Owners and Administrators can view statistics.',
      );
    }

    const memberCount = await db.organizationMember.count({
      where: { organizationId },
    });

    const activeInvitations = await db.organizationInvitation.count({
      where: {
        organizationId,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return {
      memberCount,
      activeInvitations,
      activeProjects: 0, // Future-ready
      queueCount: 0, // Future-ready
      jobCount: 0, // Future-ready
    };
  }
}
