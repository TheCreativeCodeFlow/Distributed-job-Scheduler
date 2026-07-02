import { OrganizationRepository } from '../repositories/organization.js';
import { OrganizationAuthorizationService } from './authorization.js';
import { NotFoundError } from '../../../errors/index.js';

export class MembershipQueryService {
  /**
   * Lists all members in the organization.
   * Enforces tenant isolation (requester must be a member).
   */
  public static async listMembers(userId: string, organizationId: string) {
    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      organizationId,
    );

    return OrganizationRepository.listMembers(organizationId);
  }

  /**
   * Retrieves single member details.
   * Enforces tenant isolation (requester must be a member).
   */
  public static async getMemberDetails(
    userId: string,
    organizationId: string,
    memberId: string,
  ) {
    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      organizationId,
    );

    const member = await OrganizationRepository.findMemberById(
      organizationId,
      memberId,
    );
    if (!member) {
      throw new NotFoundError('Member not found.');
    }
    return member;
  }
}
