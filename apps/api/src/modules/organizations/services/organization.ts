import { db } from '../../../database/index.js';
import { OrganizationRepository } from '../repositories/organization.js';
import { OrganizationAuthorizationService } from './authorization.js';
import { ConflictError } from '../../../errors/index.js';
import { Organization, MembershipRole } from '@prisma/client';
import { logger } from '../../../logger/index.js';

export class OrganizationService {
  /**
   * Creates an organization. Automatically assigns current user as ORG_OWNER.
   */
  public static async create(
    userId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
      logoUrl?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Organization> {
    const existing = await OrganizationRepository.findBySlug(data.slug);
    if (existing) {
      logger.warn(
        { slug: data.slug },
        'Organization creation failed - slug already in use.',
      );
      throw new ConflictError('Organization slug is already in use.');
    }

    return db.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await OrganizationRepository.create(data, tx);

      // 2. Create OrganizationMembership & Assign Organization Owner role
      await OrganizationRepository.createMembership(
        {
          userId,
          organizationId: org.id,
          role: MembershipRole.ORG_OWNER,
        },
        tx,
      );

      logger.info(
        { organizationId: org.id, userId },
        'Organization created successfully.',
      );
      return org;
    });
  }

  /**
   * Updates an organization's details. Only ORG_OWNER allowed.
   */
  public static async update(
    userId: string,
    organizationId: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      metadata?: Record<string, unknown>;
      isActive?: boolean;
    },
  ): Promise<Organization> {
    // Assert owner authorization
    await OrganizationAuthorizationService.assertOwner(userId, organizationId);

    const org = await OrganizationRepository.update(organizationId, data);
    logger.info(
      { organizationId, userId },
      'Organization updated successfully.',
    );
    return org;
  }

  /**
   * Soft deletes an organization. Only ORG_OWNER allowed.
   */
  public static async softDelete(
    userId: string,
    organizationId: string,
  ): Promise<Organization> {
    // Assert owner authorization
    await OrganizationAuthorizationService.assertOwner(userId, organizationId);

    const org = await OrganizationRepository.softDelete(organizationId);
    logger.info(
      { organizationId, userId },
      'Organization soft deleted successfully.',
    );
    return org;
  }
}
