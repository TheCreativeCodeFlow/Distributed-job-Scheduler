import { db } from '../../../database/index.js';
import { OrganizationRepository } from '../repositories/organization.js';
import { UserRepository } from '../../auth/repositories/user.js';
import { OrganizationAuthorizationService } from './authorization.js';
import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
} from '../../../errors/index.js';
import { MembershipRole } from '@prisma/client';
import { logger } from '../../../logger/index.js';

export class MembershipService {
  /**
   * Adds an existing user to an organization by email.
   * Only ORG_OWNER or ORG_ADMIN allowed.
   */
  public static async addMember(
    operatorUserId: string,
    organizationId: string,
    email: string,
    role: MembershipRole,
  ) {
    // 1. Get operator membership and check permissions
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
        'Access denied. Only Owners and Administrators can add members.',
      );
    }

    // Admins cannot add owners or other admins
    if (operatorRole === MembershipRole.ORG_ADMIN) {
      if (
        role === MembershipRole.ORG_OWNER ||
        role === MembershipRole.ORG_ADMIN
      ) {
        throw new AuthorizationError(
          'Access denied. Administrators cannot add owners or other administrators.',
        );
      }
    }

    // 2. Find target user
    const targetUser = await UserRepository.findByEmail(email);
    if (!targetUser) {
      logger.warn({ email }, 'Failed to add member - email not found.');
      throw new NotFoundError('User with this email address does not exist.');
    }

    // 3. Check for duplicate membership
    const existingMembership =
      await OrganizationRepository.findMembershipByUserId(
        organizationId,
        targetUser.id,
      );
    if (existingMembership) {
      throw new ConflictError('User is already a member of this organization.');
    }

    // 4. Create membership atomically
    return db.$transaction(async (tx) => {
      const membership = await OrganizationRepository.createMembership(
        {
          userId: targetUser.id,
          organizationId,
          role,
          createdBy: operatorUserId,
        },
        tx,
      );

      logger.info(
        { organizationId, userId: targetUser.id, role, operatorUserId },
        'Member added successfully.',
      );
      return membership;
    });
  }

  /**
   * Updates a member's role.
   */
  public static async updateRole(
    operatorUserId: string,
    organizationId: string,
    memberId: string,
    newRole: MembershipRole,
  ) {
    // 1. Get target membership
    const target = await OrganizationRepository.findMemberById(
      organizationId,
      memberId,
    );
    if (!target) {
      throw new NotFoundError('Membership record not found.');
    }

    // 2. Get operator membership
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        organizationId,
      );

    // 3. Validate permissions
    if (operatorRole === MembershipRole.ORG_ADMIN) {
      if (
        target.role === MembershipRole.ORG_OWNER ||
        target.role === MembershipRole.ORG_ADMIN
      ) {
        throw new AuthorizationError(
          'Access denied. Administrators cannot update owners or other administrators.',
        );
      }
      if (
        newRole === MembershipRole.ORG_OWNER ||
        newRole === MembershipRole.ORG_ADMIN
      ) {
        throw new AuthorizationError(
          'Access denied. Administrators cannot promote members to administrator or owner.',
        );
      }
    } else if (operatorRole !== MembershipRole.ORG_OWNER) {
      throw new AuthorizationError(
        'Access denied. Only Owners and Administrators can manage members.',
      );
    }

    // 4. Constraint checks for owner changes
    if (
      target.role === MembershipRole.ORG_OWNER &&
      newRole !== MembershipRole.ORG_OWNER
    ) {
      const members = await OrganizationRepository.listMembers(organizationId);
      const owners = members.filter((m) => m.role === MembershipRole.ORG_OWNER);
      if (owners.length <= 1) {
        throw new ConflictError(
          'Cannot demote the sole Organization Owner. You must promote another member to owner first.',
        );
      }
    }

    // 5. Update role in database
    const updated = await OrganizationRepository.updateMembership(
      memberId,
      newRole,
    );
    logger.info(
      { organizationId, memberId, newRole, operatorUserId },
      'Member role updated successfully.',
    );
    return updated;
  }

  /**
   * Removes a member from the organization.
   */
  public static async removeMember(
    operatorUserId: string,
    organizationId: string,
    memberId: string,
  ) {
    // 1. Get target membership
    const target = await OrganizationRepository.findMemberById(
      organizationId,
      memberId,
    );
    if (!target) {
      throw new NotFoundError('Membership record not found.');
    }

    // 2. Get operator membership
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        organizationId,
      );

    const isSelf = target.userId === operatorUserId;

    // 3. Validate self-removal or operator permission
    if (isSelf) {
      if (target.role === MembershipRole.ORG_OWNER) {
        const members =
          await OrganizationRepository.listMembers(organizationId);
        const owners = members.filter(
          (m) => m.role === MembershipRole.ORG_OWNER,
        );
        if (owners.length <= 1) {
          throw new ConflictError(
            'Cannot leave the organization as the sole owner. You must assign another owner first.',
          );
        }
      }
    } else {
      if (operatorRole === MembershipRole.ORG_ADMIN) {
        if (
          target.role === MembershipRole.ORG_OWNER ||
          target.role === MembershipRole.ORG_ADMIN
        ) {
          throw new AuthorizationError(
            'Access denied. Administrators cannot remove owners or other administrators.',
          );
        }
      } else if (operatorRole !== MembershipRole.ORG_OWNER) {
        throw new AuthorizationError(
          'Access denied. Insufficient privileges to remove members.',
        );
      }
    }

    // 4. Delete membership from database
    await OrganizationRepository.deleteMembership(memberId);
    logger.info(
      { organizationId, memberId, operatorUserId },
      'Member removed successfully.',
    );
  }
}
