import { OrganizationRepository } from '../repositories/organization.js';
import { OrganizationAuthorizationService } from './authorization.js';
import { Organization } from '@prisma/client';
import { NotFoundError } from '../../../errors/index.js';

export class OrganizationQueryService {
  /**
   * Retrieves organization by ID, verifying user membership.
   */
  public static async getById(
    userId: string,
    organizationId: string,
  ): Promise<Organization> {
    // Assert user is a member
    await OrganizationAuthorizationService.assertMembership(
      userId,
      organizationId,
    );

    const org = await OrganizationRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundError('Organization not found.');
    }
    return org;
  }

  /**
   * Lists organizations for the current user.
   */
  public static async listForUser(userId: string): Promise<Organization[]> {
    return OrganizationRepository.listForUser(userId);
  }
}
