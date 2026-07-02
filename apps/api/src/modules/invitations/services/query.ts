import { InvitationRepository } from '../repositories/invitation.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import { NotFoundError } from '../../../errors/index.js';
import { OrganizationInvitation } from '@prisma/client';

export class InvitationQueryService {
  /**
   * Lists all invitations for an organization.
   * Enforces tenant isolation (requester must be a member of the organization).
   */
  public static async listForOrg(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationInvitation[]> {
    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      organizationId,
    );

    return InvitationRepository.listForOrg(organizationId);
  }

  /**
   * Retrieves detailed invitation metrics.
   * Enforces tenant isolation.
   */
  public static async getInvitationDetails(
    userId: string,
    organizationId: string,
    invitationId: string,
  ): Promise<OrganizationInvitation> {
    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      organizationId,
    );

    const invitation = await InvitationRepository.findById(invitationId);
    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundError('Invitation not found.');
    }
    return invitation;
  }
}
