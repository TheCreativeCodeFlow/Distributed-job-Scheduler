import { OrganizationRepository } from '../repositories/organization.js';
import { AuthorizationError, NotFoundError } from '../../../errors/index.js';
import { MembershipRole } from '@prisma/client';

export class OrganizationAuthorizationService {
  /**
   * Asserts the user is a member of the organization, returning the role.
   */
  public static async assertMembership(
    userId: string,
    organizationId: string,
  ): Promise<MembershipRole> {
    const membership = await OrganizationRepository.getMembership(
      userId,
      organizationId,
    );
    if (!membership) {
      throw new NotFoundError('Organization not found.');
    }
    return membership.role;
  }

  /**
   * Asserts the user is the owner of the organization.
   */
  public static async assertOwner(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const role = await this.assertMembership(userId, organizationId);
    if (role !== MembershipRole.ORG_OWNER) {
      throw new AuthorizationError(
        'Access denied. Only the Organization Owner can perform this action.',
      );
    }
  }
}
